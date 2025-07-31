package webviewapp

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import webviewapp.ui.theme.WebViewAppTheme
import androidx.core.net.toUri

const val MAIN_URI: String = "https://matedevdao.github.io/mate-app/?platform=android&source=webview"

class MainActivity : ComponentActivity() {
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val uriArray: Array<Uri>? = when {
                result.resultCode != Activity.RESULT_OK -> null   // 사용자가 취소
                result.data?.clipData != null -> {                // 여러 장 선택
                    val clip = result.data!!.clipData!!
                    Array(clip.itemCount) { clip.getItemAt(it).uri }
                }
                else -> WebChromeClient.FileChooserParams.parseResult( // 단일 선택
                    result.resultCode, result.data)
            }

            fileCallback?.onReceiveValue(uriArray)
            fileCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
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
                            fileCallback?.onReceiveValue(null) // 이전 콜백 정리
                            fileCallback = callback
                            try {
                                fileChooserLauncher.launch(intent)
                            } catch (e: ActivityNotFoundException) {
                                fileCallback = null
                            }
                        }
                    )
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    url: String,
    modifier: Modifier = Modifier,
    onFileChooser: ((ValueCallback<Array<Uri>>, Intent) -> Unit)? = null
) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                setBackgroundColor(Color.BLACK)
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    setSupportMultipleWindows(true)
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest
                    ): Boolean {
                        val requestedUrl = request.url.toString()
                        if (requestedUrl.startsWith("http://") || requestedUrl.startsWith("https://")) {
                            return false
                        } else {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, request.url)
                                view.context.startActivity(intent)
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                            return true
                        }
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: ValueCallback<Array<Uri>>,
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
                        val newWebView = WebView(ctx)
                        newWebView.settings.javaScriptEnabled = true
                        newWebView.webViewClient = object : WebViewClient() {
                            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                                if (url != null) {
                                    val intent = Intent(Intent.ACTION_VIEW, url.toUri())
                                    ctx.startActivity(intent)
                                }
                                newWebView.destroy()
                            }
                        }
                        val transport = resultMsg.obj as WebView.WebViewTransport
                        transport.webView = newWebView
                        resultMsg.sendToTarget()
                        return true
                    }
                }

                loadUrl(url)
            }
        },
        modifier = modifier.fillMaxSize()
    )
}
