import SwiftUI
import WebKit

let mainURL = URL(string: "https://matedevdao.github.io/mate-app/?platform=ios&source=webview")!

// WKWebView를 .sheet(item:)에 쓰기 위한 Identifiable
extension WKWebView: @retroactive Identifiable {
    public var id: UUID { UUID() }
}

// 팝업 WebView 컨테이너
struct PopupWebView: View {
    let webView: WKWebView
    var body: some View {
        WebViewRepresentable(webView: webView)
    }
}

struct WebViewRepresentable: UIViewRepresentable {
    let webView: WKWebView
    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

// 메인 WebView (+ 팝업 전달)
struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var popupWebView: WKWebView?

    // ⬇️ 진행률/로딩 상태를 SwiftUI로 올리기 위한 바인딩
    @Binding var progress: Double   // 0.0 ~ 1.0
    @Binding var isLoading: Bool

    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKPreferences()
        preferences.javaScriptCanOpenWindowsAutomatically = true

        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isInspectable = true

        // 처음 로드
        webView.load(URLRequest(url: url))

        // KVO로 estimatedProgress 관찰
        context.coordinator.progressObs = webView.observe(\.estimatedProgress, options: [.new]) { _, change in
            DispatchQueue.main.async {
                self.progress = change.newValue ?? 0
            }
        }

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WebView
        var progressObs: NSKeyValueObservation?

        init(_ parent: WebView) { self.parent = parent }

        // 로딩 시작/끝 → isLoading 갱신
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async { self.parent.isLoading = true }
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.progress = 1.0
            }
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async { self.parent.isLoading = false }
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async { self.parent.isLoading = false }
        }

        // 딥링크 처리(원본 유지)
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url {
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

        // 팝업 처리(원본 유지)
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            let popup = WKWebView(frame: .zero, configuration: configuration)
            popup.navigationDelegate = self
            popup.uiDelegate = self
            self.parent.popupWebView = popup
            return popup
        }

        deinit { progressObs?.invalidate() }
    }
}

struct ContentView: View {
    @State private var popupWebView: WKWebView?

    // ⬇️ 진행률/로딩 상태
    @State private var progress: Double = 0.0
    @State private var isLoading: Bool = false

    var body: some View {
        ZStack {
            WebView(
                url: mainURL,
                popupWebView: $popupWebView,
                progress: $progress,
                isLoading: $isLoading
            )
            .edgesIgnoringSafeArea(.all)
            .sheet(item: $popupWebView) { webView in
                PopupWebView(webView: webView)
            }

            // === 가운데 오버레이 (로딩 중일 때만) ===
            if isLoading || progress < 1.0 {
                Color.black.opacity(0.4).ignoresSafeArea()
                VStack(spacing: 12) {
                    // 스피너
                    ProgressView()
                        .progressViewStyle(.circular)

                    // 퍼센트 텍스트
                    Text("\(Int((progress.clamped(to: 0...1)) * 100))%")
                        .font(.title3.weight(.semibold))
                        .foregroundColor(.white)

                    // 원하면 안내문구도 추가 가능:
                    // Text("페이지를 불러오는 중…").foregroundColor(.white.opacity(0.9))
                }
            }
        }
    }
}

// 작은 유틸
fileprivate extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}

#Preview {
    ContentView()
}
