package webviewapp

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.util.Base64
import android.util.Log
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.credentials.ClearCredentialStateRequest
import com.google.android.gms.tasks.OnCompleteListener
import com.google.firebase.messaging.FirebaseMessaging
import java.security.SecureRandom
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import webviewapp.ui.theme.WebViewAppTheme

fun generateNonce(bytes: Int = 16): String {
    val b = ByteArray(bytes)
    SecureRandom().nextBytes(b)
    return Base64.encodeToString(b, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
}

const val MAIN_URI: String = "https://matedevdao.github.io/mate-app/?platform=android&source=webview"
const val WEB_CLIENT_ID: String = "996341622273-ph42ssb0778khivgjpuj7sbmg6hjrk2o.apps.googleusercontent.com"

class MainActivity : ComponentActivity() {

    private val credentialManager by lazy { CredentialManager.create(this) }
    private val loginNonce: String by lazy { generateNonce() }

    private var fileCallback: ValueCallback<Array<android.net.Uri>>? = null
    private var webViewRef: WebView? = null

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val uriArray: Array<android.net.Uri>? = when {
                result.resultCode != Activity.RESULT_OK -> null
                result.data?.clipData != null -> {
                    val clip = result.data!!.clipData!!
                    Array(clip.itemCount) { clip.getItemAt(it).uri }
                }
                else -> WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            }
            fileCallback?.onReceiveValue(uriArray)
            fileCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        askNotificationPermission()

        FirebaseMessaging.getInstance().token.addOnCompleteListener(OnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w("FCM", "Fetching FCM registration token failed", task.exception)
                return@OnCompleteListener
            }
            val token = task.result
            val msg = "FCM registration token: %s".format(token)
            Log.d("FCM", msg)
            //Toast.makeText(baseContext, msg, Toast.LENGTH_SHORT).show()
        })

        setContent {
            WebViewAppTheme {
                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .imePadding()
                ) { innerPadding ->
                    WebViewScreen(
                        url = MAIN_URI,
                        modifier = Modifier.padding(innerPadding),
                        onFileChooser = { callback, intent ->
                            fileCallback?.onReceiveValue(null)
                            fileCallback = callback
                            try {
                                fileChooserLauncher.launch(intent)
                            } catch (e: ActivityNotFoundException) {
                                fileCallback = null
                            }
                        },
                        onWebViewReady = { wv -> webViewRef = wv },
                        startGoogleSignIn = { launchSignInWithGoogle() },
                        startGoogleSignOut = { launchSignOutFromGoogle() }
                    )
                }
            }
        }
    }

    // === Credential Manager: 구글 로그인 실행 ===
    private fun launchSignInWithGoogle() {
        lifecycleScope.launch {
            val option = GetSignInWithGoogleOption.Builder(
                serverClientId = WEB_CLIENT_ID
            ).setNonce(loginNonce).build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(option) // SIWG 버튼 흐름: 단독 옵션
                .build()

            try {
                val result: GetCredentialResponse = credentialManager.getCredential(
                    context = this@MainActivity,
                    request = request
                )
                handleGoogleResult(result)
            } catch (e: GetCredentialException) {
                Log.e("SIWG", "getCredential failed", e)
                webViewRef?.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('googleSignInFailed', {detail:{message:'${e::class.java.simpleName}'}}))",
                    null
                )
            }
        }
    }

    /** 구글 로그아웃 실행 */
    private fun launchSignOutFromGoogle() {
        lifecycleScope.launch {
            try {
                // 1) Credential Manager에서 현재 자격 상태 제거 (앱 레벨의 '로그아웃')
                credentialManager.clearCredentialState(
                    ClearCredentialStateRequest()
                )

                // 2) WebView 세션(쿠키)도 정리
                clearWebViewSession()

                // 3) 웹에 알림 이벤트 전송 (필요 시)
                webViewRef?.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('googleSignOutComplete'))",
                    null
                )
            } catch (e: ClearCredentialException) {
                Log.e("SIWG", "clearCredentialState failed", e)
                webViewRef?.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('googleSignOutFailed', {detail:{message:'${e::class.java.simpleName}'}}))",
                    null
                )
            } catch (t: Throwable) {
                Log.e("SIWG", "Unexpected sign-out error", t)
                webViewRef?.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('googleSignOutFailed', {detail:{message:'Unexpected'}}))",
                    null
                )
            }
        }
    }

    /** WebView 쿠키 정리 */
    private fun clearWebViewSession() {
        try {
            // 쿠키 삭제
            android.webkit.CookieManager.getInstance().apply {
                removeAllCookies(null)
                flush()
            }
        } catch (_: Throwable) {
            // 무시: 기기별 차이
        }
    }

    private fun handleGoogleResult(result: GetCredentialResponse) {
        val cred = result.credential
        if (cred is androidx.credentials.CustomCredential &&
            cred.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            try {
                val google = GoogleIdTokenCredential.createFrom(cred.data)
                val idToken = google.idToken
                val js = """
                  window.dispatchEvent(new CustomEvent('googleSignInComplete', {
                    detail: { idToken: ${org.json.JSONObject.quote(idToken)}, nonce: ${org.json.JSONObject.quote(loginNonce)} }
                  }));
                """.trimIndent()
                webViewRef?.evaluateJavascript(js, null)
            } catch (e: GoogleIdTokenParsingException) {
                Log.e("SIWG", "Invalid Google ID token", e)
                webViewRef?.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('googleSignInFailed', {detail:{message:'GoogleIdTokenParsingException'}}))",
                    null
                )
            }
        } else {
            Log.e("SIWG", "Unexpected credential type: ${cred::class.java.simpleName}")
            webViewRef?.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('googleSignInFailed', {detail:{message:'UnexpectedCredential'}}))",
                null
            )
        }
    }

    // 알림 권한(FCM): 기존 유지
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { isGranted: Boolean ->
        if (isGranted) {
            // granted
        } else {
            // denied
        }
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                // granted
            } else if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                // 교육용 UI 고려 가능
            } else {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    url: String,
    modifier: Modifier = Modifier,
    onFileChooser: ((ValueCallback<Array<android.net.Uri>>, Intent) -> Unit)? = null,
    onWebViewReady: ((WebView) -> Unit)? = null,
    startGoogleSignIn: () -> Unit,
    startGoogleSignOut: () -> Unit
) {
    var webView: WebView? by remember { mutableStateOf(null) }
    var progress by remember { mutableStateOf(0) }

    BackHandler(enabled = true) {
        if (webView?.canGoBack() == true) webView?.goBack()
        else (webView?.context as? Activity)?.finish()
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    setBackgroundColor(Color.BLACK)
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        setSupportMultipleWindows(true)
                        javaScriptCanOpenWindowsAutomatically = true
                    }

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            view: WebView,
                            request: WebResourceRequest
                        ): Boolean {
                            val u = request.url
                            val urlStr = u.toString()

                            // http/https 이외 스킴은 외부 앱으로
                            if (!(urlStr.startsWith("http://") || urlStr.startsWith("https://"))) {
                                return try {
                                    val intent = Intent(Intent.ACTION_VIEW, u)
                                    view.context.startActivity(intent)
                                    true
                                } catch (_: Exception) {
                                    true
                                }
                            }
                            // 나머지는 WebView에서 처리
                            return false
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<android.net.Uri>>,
                            fileChooserParams: FileChooserParams
                        ): Boolean {
                            onFileChooser?.invoke(filePathCallback, fileChooserParams.createIntent())
                            return true
                        }

                        override fun onCreateWindow(
                            view: WebView,
                            isDialog: Boolean,
                            isUserGesture: Boolean,
                            resultMsg: Message
                        ): Boolean {
                            val ctx = view.context

                            // 1) hitTestResult로 바로 열 수 있으면 즉시 외부 브라우저로
                            val result = view.hitTestResult
                            val urlFromHitTest = result.extra
                            if (!urlFromHitTest.isNullOrBlank()) {
                                try {
                                    ctx.startActivity(Intent(Intent.ACTION_VIEW, urlFromHitTest.toUri()))
                                    return false // 새 창 불필요
                                } catch (_: Exception) { /* fallback 아래로 */ }
                            }

                            // 2) fallback: 임시 WebView를 만들어 shouldOverrideUrlLoading에서 외부 브라우저로 넘김
                            val tmp = WebView(ctx).apply {
                                settings.javaScriptEnabled = true
                                webViewClient = object : WebViewClient() {
                                    override fun shouldOverrideUrlLoading(
                                        v: WebView,
                                        req: WebResourceRequest
                                    ): Boolean {
                                        return try {
                                            ctx.startActivity(Intent(Intent.ACTION_VIEW, req.url))
                                            true
                                        } catch (_: Exception) {
                                            true
                                        }
                                    }
                                }
                            }

                            (resultMsg.obj as WebView.WebViewTransport).webView = tmp
                            resultMsg.sendToTarget()
                            return true
                        }

                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            progress = newProgress.coerceIn(0, 100)
                        }
                    }

                    // JS → Android 브리지: window.Native.signInWithGoogle()
                    addJavascriptInterface(
                        JsBridge(
                            startGoogleSignIn = { startGoogleSignIn() },
                            startGoogleSignOut = { startGoogleSignOut() }
                        ),
                        "Native"
                    )

                    loadUrl(url)
                    webView = this
                    onWebViewReady?.invoke(this)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        if (progress in 0..99) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .imePadding()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator()
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = "$progress%",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

class JsBridge(
    private val startGoogleSignIn: () -> Unit,
    private val startGoogleSignOut: () -> Unit
) {
    @android.webkit.JavascriptInterface
    fun signInWithGoogle() {
        startGoogleSignIn()
    }

    @android.webkit.JavascriptInterface
    fun signOutFromGoogle() {
        startGoogleSignOut()
    }
}
