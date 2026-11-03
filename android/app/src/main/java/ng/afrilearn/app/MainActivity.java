package ng.afrilearn.app;

import android.Manifest;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.SystemClock;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.SystemBarStyle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.ArrayList;
import java.util.List;

/**
 * The AfriLearn prototype app: the live platform in a full-screen WebView, with the
 * phone features it needs (camera and microphone for live classes, file uploads,
 * PDF downloads, pull to refresh and an offline screen).
 */
public class MainActivity extends ComponentActivity {

    private WebView web;
    private SwipeRefreshLayout swipe;
    private ProgressBar progress;
    private View offline;
    private boolean firstPageShown = false;
    private long lastBackPress = 0;

    private ValueCallback<Uri[]> pendingFiles;
    private PermissionRequest pendingPermission;

    private final ActivityResultLauncher<Intent> pickFiles = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (pendingFiles == null) return;
                Uri[] uris = WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData());
                pendingFiles.onReceiveValue(uris);
                pendingFiles = null;
            });

    private final ActivityResultLauncher<String[]> askPermissions = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(), granted -> grantPendingPermission());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this,
                SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
                SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT));
        setContentView(R.layout.activity_main);

        // Keep the logo on screen until the first page has drawn, for at most four seconds.
        final long started = SystemClock.uptimeMillis();
        splash.setKeepOnScreenCondition(() -> !firstPageShown && SystemClock.uptimeMillis() - started < 4000);

        View root = findViewById(R.id.root);
        web = findViewById(R.id.web);
        swipe = findViewById(R.id.swipe);
        progress = findViewById(R.id.progress);
        offline = findViewById(R.id.offline);

        // Draw edge to edge, but keep the page clear of the status bar, navigation bar and keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        configureWebView();

        swipe.setColorSchemeColors(ContextCompat.getColor(this, R.color.adire_700));
        swipe.setOnRefreshListener(() -> web.reload());
        // Only pull to refresh from the very top, and never during a test or a live class.
        swipe.setOnChildScrollUpCallback((parent, child) -> web.getScrollY() > 0 || isNoRefreshPage(web.getUrl()));

        findViewById(R.id.retry).setOnClickListener(v -> {
            offline.setVisibility(View.GONE);
            web.reload();
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (web.canGoBack()) {
                    web.goBack();
                    return;
                }
                long now = SystemClock.uptimeMillis();
                if (now - lastBackPress < 2000) {
                    finish();
                } else {
                    lastBackPress = now;
                    Toast.makeText(MainActivity.this, R.string.press_back_again, Toast.LENGTH_SHORT).show();
                }
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            Uri link = getIntent() != null ? getIntent().getData() : null;
            web.loadUrl(link != null && isOurHost(link) ? link.toString() : BuildConfig.START_URL);
        }
    }

    private void configureWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setSupportMultipleWindows(false);
        // Lets the website know it is running inside the app.
        s.setUserAgentString(s.getUserAgentString() + " AfriLearnApp/" + BuildConfig.VERSION_NAME);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                return openOutside(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                firstPageShown = true;
                swipe.setRefreshing(false);
                progress.setVisibility(View.GONE);
                CookieManager.getInstance().flush();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    firstPageShown = true;
                    swipe.setRefreshing(false);
                    offline.setVisibility(View.VISIBLE);
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                if (newProgress >= 100) progress.setVisibility(View.GONE);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = callback;
                try {
                    Intent intent = params.createIntent();
                    if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    }
                    pickFiles.launch(intent);
                    return true;
                } catch (ActivityNotFoundException e) {
                    pendingFiles = null;
                    return false;
                }
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (pendingPermission != null) pendingPermission.deny();
                    pendingPermission = request;
                    List<String> needed = new ArrayList<>();
                    for (String r : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r) && !has(Manifest.permission.CAMERA)) {
                            needed.add(Manifest.permission.CAMERA);
                        }
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r) && !has(Manifest.permission.RECORD_AUDIO)) {
                            needed.add(Manifest.permission.RECORD_AUDIO);
                        }
                    }
                    if (needed.isEmpty()) {
                        grantPendingPermission();
                    } else {
                        askPermissions.launch(needed.toArray(new String[0]));
                    }
                });
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingPermission == request) pendingPermission = null;
            }
        });

        web.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                String name = URLUtil.guessFileName(url, contentDisposition, mimeType);
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) r.addRequestHeader("Cookie", cookie);
                r.addRequestHeader("User-Agent", userAgent);
                r.setTitle(name);
                r.setMimeType(mimeType);
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                } else {
                    r.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, name);
                }
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.enqueue(r);
                Toast.makeText(this, getString(R.string.downloading, name), Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
            }
        });
    }

    /** Grants the page only the camera and microphone access Android has allowed. */
    private void grantPendingPermission() {
        PermissionRequest request = pendingPermission;
        pendingPermission = null;
        if (request == null) return;
        List<String> allowed = new ArrayList<>();
        for (String r : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r) && has(Manifest.permission.CAMERA)) allowed.add(r);
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r) && has(Manifest.permission.RECORD_AUDIO)) allowed.add(r);
        }
        if (allowed.isEmpty()) request.deny();
        else request.grant(allowed.toArray(new String[0]));
    }

    private boolean has(String permission) {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isOurHost(Uri uri) {
        return "https".equals(uri.getScheme()) && BuildConfig.APP_HOST.equalsIgnoreCase(uri.getHost());
    }

    /** Pages where an accidental pull to refresh would interrupt something. */
    private boolean isNoRefreshPage(String url) {
        return url != null && (url.contains("/live/") || url.contains("/exam/"));
    }

    /**
     * Keeps AfriLearn and payment pages inside the app; sends everything else
     * (email, phone, other websites) to the right app on the phone.
     */
    private boolean openOutside(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        boolean inApp = "https".equals(scheme) && (isOurHost(uri)
                || host.endsWith("paystack.com") || host.endsWith("paystack.co")
                || host.equals("8x8.vc") || host.endsWith(".8x8.vc"));
        if (inApp) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, R.string.no_app, Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri link = intent.getData();
        if (link != null && isOurHost(link)) web.loadUrl(link.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
        }
        super.onDestroy();
    }
}
