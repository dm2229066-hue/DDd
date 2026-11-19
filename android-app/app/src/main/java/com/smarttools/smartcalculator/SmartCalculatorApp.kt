package com.smarttools.smartcalculator

import android.app.Application
import com.smarttools.smartcalculator.ads.AdMobManager

class SmartCalculatorApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // AdMob initializes asynchronously off the critical UI path for instant startup
        AdMobManager.initialize(this)
    }
}
