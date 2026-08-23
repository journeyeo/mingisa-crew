package com.mingisa.crew;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Build;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsetsController;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().getInsetsController().setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            );
        }

        WebView webView = this.bridge.getWebView();
        webView.setBackgroundColor(Color.TRANSPARENT);
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
