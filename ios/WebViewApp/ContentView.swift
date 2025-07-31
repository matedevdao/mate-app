import SwiftUI
import WebKit

let mainURL = URL(string: "https://matedevdao.github.io/mate-app/?platform=ios&source=webview")!

// WKWebView를 Identifiable로 만들어 .sheet(item:) 수정자에서 사용할 수 있게 합니다.
extension WKWebView: @retroactive Identifiable {
    public var id: UUID {
        return UUID()
    }
}

// 팝업으로 표시될 WebView를 감싸는 SwiftUI 뷰입니다.
struct PopupWebView: View {
    let webView: WKWebView
    
    var body: some View {
        // WKWebView를 SwiftUI에서 사용하기 위해 UIViewRepresentable을 사용합니다.
        WebViewRepresentable(webView: webView)
    }
}

// PopupWebView 내부에서 실제 WKWebView를 표시하는 UIViewRepresentable입니다.
struct WebViewRepresentable: UIViewRepresentable {
    let webView: WKWebView
    
    func makeUIView(context: Context) -> WKWebView {
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

// 메인 WebView와 팝업 로직을 처리하는 뷰입니다.
struct WebView: UIViewRepresentable {
    let url: URL
    // ContentView의 State와 바인딩하여 팝업 WebView를 전달합니다.
    @Binding var popupWebView: WKWebView?

    func makeUIView(context: Context) -> WKWebView {
        // JavaScript로 윈도우를 열 수 있도록 설정합니다.
        let preferences = WKPreferences()
        preferences.javaScriptCanOpenWindowsAutomatically = true
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences

        // 설정과 함께 WebView를 생성합니다.
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        // UIDelegate를 설정하여 팝업 이벤트를 받습니다.
        webView.uiDelegate = context.coordinator
        webView.isInspectable = true
        
        let request = URLRequest(url: url)
        webView.load(request)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // 필요 시 업데이트
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WebView

        init(_ parent: WebView) {
            self.parent = parent
        }

        // 딥링크 처리 로직 (기존 코드 유지)
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url {
                print("Request URL: \(url)")
                if url.scheme != "http" && url.scheme != "https" {
                    if UIApplication.shared.canOpenURL(url) {
                        UIApplication.shared.open(url)
                        decisionHandler(.cancel)
                        return
                    }
                }
            }
            decisionHandler(.allow)
        }
        
        // 팝업(새 창) 요청을 처리하는 메소드
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            
            // 새 WebView를 생성하여 팝업으로 표시합니다.
            let popup = WKWebView(frame: .zero, configuration: configuration)
            popup.navigationDelegate = self
            popup.uiDelegate = self
            
            // 생성된 팝업 WebView를 부모 View(ContentView)의 State에 할당합니다.
            self.parent.popupWebView = popup
            
            return popup
        }
    }
}

struct ContentView: View {
    // 팝업으로 띄울 WKWebView 객체를 관리하는 State
    @State private var popupWebView: WKWebView?

    var body: some View {
        WebView(url: mainURL, popupWebView: $popupWebView)
            .edgesIgnoringSafeArea(.all)
            // popupWebView State가 nil이 아닐 때 시트(Sheet)를 띄웁니다.
            .sheet(item: $popupWebView) { webView in
                // 팝업 WebView를 담고 있는 뷰를 시트로 표시합니다.
                PopupWebView(webView: webView)
            }
    }
}

#Preview {
    ContentView()
}
