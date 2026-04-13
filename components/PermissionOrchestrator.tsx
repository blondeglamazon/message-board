'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Capacitor } from '@capacitor/core'
import { AppTrackingTransparency } from '@capgo/capacitor-app-tracking-transparency'
import { AdMob } from '@capacitor-community/admob'

type Step = 'loading' | 'eula' | 'att' | 'umpAndAdMob' | 'done'

const EULA_KEY = 'vimciety_eula_accepted'
const ATT_HANDLED_KEY = 'vimciety_att_handled' // tracks whether we've attempted ATT this install

export default function PermissionOrchestrator() {
  const [step, setStep] = useState<Step>('loading')

  // -------- STEP GATES --------

  // Determines starting step based on persisted state
  useEffect(() => {
    if (typeof window === 'undefined') return

    const eulaAccepted = localStorage.getItem(EULA_KEY) === 'true'
    if (!eulaAccepted) {
      setStep('eula')
      return
    }

    // EULA already accepted on a previous launch. Jump to the next uncompleted step.
    advanceFromEula()
  }, [])

  // ---------- EULA step ----------
  const handleEulaAgree = useCallback(() => {
    localStorage.setItem(EULA_KEY, 'true')
    // Notify anything else in the app that may be listening for the event
    // (keeps backward compat with usePushNotifications hook)
    window.dispatchEvent(new Event('eula_accepted'))
    advanceFromEula()
  }, [])

  const advanceFromEula = useCallback(async () => {
    // On iOS, check ATT status
    if (Capacitor.getPlatform() === 'ios') {
      try {
        const status = await AppTrackingTransparency.getStatus()
        if (status.status === 'notDetermined') {
          setStep('att')
          return
        }
      } catch (e) {
        console.error('[permissions] ATT status check failed:', e)
      }
    }
    // Not iOS, or ATT already answered → straight to UMP/AdMob
    setStep('umpAndAdMob')
  }, [])

  // ---------- ATT step ----------
  useEffect(() => {
    if (step !== 'att') return

    let cancelled = false
    const runATT = async () => {
      try {
        await AppTrackingTransparency.requestPermission()
      } catch (e) {
        console.error('[permissions] ATT request failed:', e)
      } finally {
        localStorage.setItem(ATT_HANDLED_KEY, 'true')
        if (!cancelled) setStep('umpAndAdMob')
      }
    }
    runATT()

    return () => {
      cancelled = true
    }
  }, [step])

  // ---------- UMP + AdMob init ----------
  useEffect(() => {
    if (step !== 'umpAndAdMob') return

    let cancelled = false
    const runAdMobConsent = async () => {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setStep('done')
        return
      }

      try {
        // Initialize AdMob first — this is a no-op if already initialized
        await AdMob.initialize({
          initializeForTesting: false, // set true while testing if needed
        } as any)

        // Request consent info and show the UMP form if needed.
        // The plugin handles EEA/UK targeting automatically based on dashboard config.
        const consentInfo = await AdMob.requestConsentInfo()

        if (
          consentInfo.status === 'REQUIRED' ||
          consentInfo.status === 'UNKNOWN'
        ) {
          if (consentInfo.isConsentFormAvailable) {
            await AdMob.showConsentForm()
          }
        }
      } catch (e) {
        console.error('[permissions] AdMob/UMP setup failed:', e)
      } finally {
        if (!cancelled) setStep('done')
      }
    }

    runAdMobConsent()

    return () => {
      cancelled = true
    }
  }, [step])

  // -------- RENDER: only the EULA step has UI; everything else is background --------

  if (step !== 'eula') return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#1f2937',
          color: 'white',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: 'min(400px, 92vw)',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
          Terms of Use
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#d1d5db',
            lineHeight: '1.6',
            marginBottom: '15px',
          }}
        >
          Welcome to VIMciety! Before you join our community, you must agree to our
          Terms of Use and Community Guidelines.
        </p>

        <div
          style={{
            backgroundColor: '#374151',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              margin: 0,
              fontWeight: 'bold',
              color: '#fbbf24',
            }}
          >
            Zero Tolerance Policy:
          </p>
          <p
            style={{
              fontSize: '13px',
              margin: '5px 0 0 0',
              color: '#e5e7eb',
              lineHeight: '1.5',
            }}
          >
            VIMciety has absolutely no tolerance for objectionable content or abusive
            users. Any users found violating this policy, posting inappropriate
            content, or harassing others will be immediately permanently banned
            without warning.
          </p>
        </div>

        <div
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginBottom: '25px',
            textAlign: 'center',
          }}
        >
          Read the full{' '}
          <Link href="/terms" style={{ color: '#6366f1', textDecoration: 'underline' }}>
            Terms of Use (EULA)
          </Link>
          .
        </div>

        <button
          onClick={handleEulaAgree}
          style={{
            backgroundColor: '#6366f1',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '16px',
            minHeight: '44px',
          }}
        >
          I Agree
        </button>
      </div>
    </div>
  )
}