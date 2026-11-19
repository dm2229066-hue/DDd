package com.smarttools.smartcalculator.ads

import android.app.Activity
import android.content.Context
import android.view.ViewGroup
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Configurable Google AdMob & UMP Consent manager.
 * Uses official Google AdMob test ad unit IDs during development.
 * Never blocks calculator functionality if offline or if ads are disabled.
 */
object AdMobManager {
    const val TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
    const val TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917"

    @Volatile
    private var isInitialized = false
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null
    private var lastInterstitialShownMillis: Long = 0L
    private const val INTERSTITIAL_COOLDOWN_MS = 90_000L

    fun initialize(context: Context) {
        if (isInitialized) return
        CoroutineScope(Dispatchers.IO).launch {
            runCatching {
                MobileAds.initialize(context.applicationContext)
                isInitialized = true
            }
        }
    }

    fun requestConsentAndLoadAds(
        activity: Activity,
        adsEnabled: Boolean,
        onConsentReady: (canRequestAds: Boolean) -> Unit
    ) {
        if (!adsEnabled) {
            onConsentReady(false)
            return
        }
        val consentInformation: ConsentInformation =
            UserMessagingPlatform.getConsentInformation(activity)
        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(false)
            .build()

        consentInformation.requestConsentInfoUpdate(
            activity,
            params,
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) {
                    val canRequest = consentInformation.canRequestAds()
                    if (canRequest) {
                        preloadInterstitial(activity)
                        preloadRewarded(activity)
                    }
                    onConsentReady(canRequest)
                }
            },
            {
                // Offline or UMP unreachable: calculator continues unhindered
                onConsentReady(false)
            }
        )
    }

    fun showPrivacyOptions(activity: Activity) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) {}
    }

    fun preloadInterstitial(context: Context) {
        InterstitialAd.load(
            context,
            TEST_INTERSTITIAL_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                }
            }
        )
    }

    fun maybeShowInterstitial(activity: Activity, adsEnabled: Boolean) {
        if (!adsEnabled) return
        val now = System.currentTimeMillis()
        if (now - lastInterstitialShownMillis < INTERSTITIAL_COOLDOWN_MS) return

        val ad = interstitialAd ?: return
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                preloadInterstitial(activity)
            }
        }
        lastInterstitialShownMillis = now
        ad.show(activity)
    }

    fun preloadRewarded(context: Context) {
        RewardedAd.load(
            context,
            TEST_REWARDED_ID,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                }
            }
        )
    }

    fun showRewardedAd(activity: Activity, onRewardEarned: () -> Unit) {
        val ad = rewardedAd ?: return
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewardedAd = null
                preloadRewarded(activity)
            }
        }
        ad.show(activity) {
            onRewardEarned()
        }
    }
}

/**
 * Non-blocking Banner Ad composable placed away from primary calculator keypad buttons.
 */
@Composable
fun AdMobBannerSlot(
    enabled: Boolean,
    modifier: Modifier = Modifier
) {
    if (!enabled) return
    AndroidView(
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        factory = { ctx ->
            AdView(ctx).apply {
                setAdSize(AdSize.BANNER)
                adUnitId = AdMobManager.TEST_BANNER_ID
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                loadAd(AdRequest.Builder().build())
            }
        }
    )
}
