'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  CalculatorEmptyState,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import { formatCurrency, formatNumber } from '@/lib/calculator-tool-utils';

const CACHE_KEY = 'apex-currency-rates-v1';
const FALLBACK_CURRENCIES = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  NGN: 'Nigerian Naira',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  JPY: 'Japanese Yen',
};

function getInitialCache() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [ratesData, setRatesData] = useState(() => getInitialCache());
  const [status, setStatus] = useState(() => (getInitialCache() ? 'cached' : 'idle'));
  const [message, setMessage] = useState(() => (getInitialCache() ? 'Showing cached rates while fresh data loads.' : ''));

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        if (!ratesData) {
          setStatus('loading');
        }

        const [latestResponse, currenciesResponse] = await Promise.all([
          fetch('https://api.frankfurter.app/latest?from=USD'),
          fetch('https://api.frankfurter.app/currencies'),
        ]);

        if (!latestResponse.ok) {
          throw new Error('Could not load exchange rates.');
        }

        const latest = await latestResponse.json();
        const currencies = currenciesResponse.ok ? await currenciesResponse.json() : FALLBACK_CURRENCIES;
        const payload = {
          ...latest,
          currencies,
          rates: {
            USD: 1,
            ...latest.rates,
          },
        };

        if (!cancelled) {
          setRatesData(payload);
          setStatus('live');
          setMessage('');
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        }
      } catch (error) {
        if (!cancelled) {
          const cached = getInitialCache();
          if (cached) {
            setRatesData(cached);
            setStatus('cached');
            setMessage(`Live rates could not be refreshed. Showing cached rates from ${cached.date}.`);
          } else {
            setStatus('error');
            setMessage(error.message || 'Could not load rates.');
          }
        }
      }
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, []);

  const numericAmount = Number.parseFloat(amount);
  const rates = ratesData?.rates || { USD: 1 };
  const currencies = ratesData?.currencies || FALLBACK_CURRENCIES;
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  const convertedAmount =
    Number.isFinite(numericAmount) && fromRate && toRate ? (numericAmount / fromRate) * toRate : null;
  const directRate = fromRate && toRate ? toRate / fromRate : null;
  const inverseRate = fromRate && toRate ? fromRate / toRate : null;
  const currencyOptions = Object.keys(currencies).sort();
  const copyValue =
    convertedAmount === null
      ? ''
      : [
          `${formatNumber(numericAmount, { maximumFractionDigits: 2 })} ${fromCurrency} = ${formatNumber(convertedAmount, { maximumFractionDigits: 2 })} ${toCurrency}`,
          `Rates updated: ${ratesData?.date || 'Unknown'}`,
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setAmount('1');
        setFromCurrency('USD');
        setToCurrency('EUR');
      }}
      privacyNote="Rates fetched from frankfurter.app · cached locally for faster repeat visits"
      options={
        <>
          <div className="options-label">Amount</div>
          <CalculatorInput
            type="number"
            placeholder="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">From</div>
          <CalculatorSelect
            value={fromCurrency}
            onChange={(event) => setFromCurrency(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            {currencyOptions.map((code) => (
              <option key={code} value={code}>
                {code} - {currencies[code]}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">To</div>
          <CalculatorSelect
            value={toCurrency}
            onChange={(event) => setToCurrency(event.target.value)}
            style={{ marginBottom: 12 }}
          >
            {currencyOptions.map((code) => (
              <option key={code} value={code}>
                {code} - {currencies[code]}
              </option>
            ))}
          </CalculatorSelect>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}
            onClick={() => {
              setFromCurrency(toCurrency);
              setToCurrency(fromCurrency);
            }}
          >
            <Icon icon={ICON_MAP.RefreshCw} size={14} />
            Swap Currencies
          </button>

          <div className="panel-divider" />
          <CalculatorNotice message={message || `Rates updated: ${ratesData?.date || 'Waiting for API response...'}`} tone={status === 'error' ? 'error' : status === 'cached' ? 'warning' : 'default'} />
        </>
      }
    >
      <OutputPanel>
        {status === 'loading' && !ratesData ? (
          <div
            style={{
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--muted)',
            }}
          >
            <Icon icon={ICON_MAP.Loader2} size={28} className="spin" />
            <div>Loading exchange rates…</div>
          </div>
        ) : null}

        {status === 'error' && !ratesData ? (
          <CalculatorNotice tone="error" message={message || 'Exchange rates could not be loaded.'} />
        ) : null}

        {ratesData && convertedAmount !== null ? (
          <>
            <CalculatorPrimaryResult
              label="Converted Amount"
              value={formatCurrency(convertedAmount, toCurrency)}
              detail={`${formatNumber(numericAmount, { maximumFractionDigits: 2 })} ${fromCurrency}`}
            />

            <CalculatorStatGrid
              items={[
                {
                  label: `1 ${fromCurrency}`,
                  value: `${formatNumber(directRate, { maximumFractionDigits: 6 })} ${toCurrency}`,
                  detail: 'Direct exchange rate',
                },
                {
                  label: `1 ${toCurrency}`,
                  value: `${formatNumber(inverseRate, { maximumFractionDigits: 6 })} ${fromCurrency}`,
                  detail: 'Inverse exchange rate',
                },
              ]}
            />

            <CalculatorSectionDivider label="Rate Info" />
            <CalculatorStatGrid
              items={[
                {
                  label: 'Rates Date',
                  value: ratesData.date,
                  detail: 'From Frankfurter API',
                },
                {
                  label: 'Rate Source',
                  value: status === 'cached' ? 'Cached' : 'Live',
                  detail: status === 'cached' ? 'Using stored data fallback' : 'Fresh API response',
                },
              ]}
            />
          </>
        ) : null}

        {ratesData && convertedAmount === null ? (
          <CalculatorEmptyState
            iconName="DollarSign"
            title="Convert between currencies with cached live rates"
            message="Enter an amount and choose your source and target currencies to convert using the latest exchange table loaded from Frankfurter."
          />
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
