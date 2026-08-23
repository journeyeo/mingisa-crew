package com.mingisa.crew;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.ViewGroup;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        ViewGroup parent = (ViewGroup) webView.getParent();

        SwipeRefreshLayout swipeRefresh = new SwipeRefreshLayout(this);
        swipeRefresh.setColorSchemeColors(0xFF1B5E36);

        int index = parent.indexOfChild(webView);
        parent.removeView(webView);
        swipeRefresh.addView(webView);
        parent.addView(swipeRefresh, index);

        swipeRefresh.setOnRefreshListener(() -> {
            webView.reload();
            swipeRefresh.setRefreshing(false);
        });

        webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) ->
            swipeRefresh.setEnabled(scrollY == 0)
        );
    }
}
