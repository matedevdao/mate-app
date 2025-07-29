import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        let request = URLRequest(url: url)
        webView.load(request)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // 필요 시 업데이트
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("웹 페이지 로드 완료")
        }
    }
}

struct ContentView: View {
    var body: some View {
        WebView(url: URL(string: "https://www.apple.com")!)
                    .edgesIgnoringSafeArea(.all) // 전체화면 사용
    }
}

#Preview {
    ContentView()
}
