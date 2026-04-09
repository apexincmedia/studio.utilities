'use client';

import { useState } from 'react';
import {
  CalculatorEmptyState,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorInput,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import { formatCurrency, formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

function calculateMortgage(homePrice, downPayment, annualRate, termYears) {
  const principal = homePrice - downPayment;
  if (principal <= 0 || termYears <= 0 || annualRate < 0) return null;

  const months = Math.round(termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / months
      : (principal * (monthlyRate * (1 + monthlyRate) ** months)) / ((1 + monthlyRate) ** months - 1);

  let balance = principal;
  let totalInterest = 0;
  const schedule = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    let principalPaid = monthlyPayment - interest;
    if (month === months || principalPaid > balance) {
      principalPaid = balance;
    }
    const payment = principalPaid + interest;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    schedule.push({
      month,
      payment,
      principalPaid,
      interest,
      balance,
    });
  }

  return {
    principal,
    monthlyPayment,
    totalInterest,
    totalPaid: principal + totalInterest,
    months,
    schedule,
  };
}

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [termYears, setTermYears] = useState('30');
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const numericHomePrice = safeNumber(homePrice);
  const numericDownPayment = safeNumber(downPayment) ?? 0;
  const numericAnnualRate = safeNumber(annualRate);
  const numericTermYears = safeNumber(termYears);
  const result =
    numericHomePrice !== null && numericAnnualRate !== null && numericTermYears !== null
      ? calculateMortgage(numericHomePrice, numericDownPayment, numericAnnualRate, numericTermYears)
      : null;
  const hasInput = Boolean(homePrice || downPayment || annualRate);
  const isInvalid =
    hasInput &&
    (result === null ||
      numericHomePrice === null ||
      numericAnnualRate === null ||
      numericTermYears === null ||
      numericDownPayment > numericHomePrice);
  const previewRows = result ? (showFullSchedule ? result.schedule : result.schedule.slice(0, 12)) : [];
  const interestShare = result ? Math.round((result.totalInterest / result.totalPaid) * 100) : 0;
  const copyValue =
    result === null
      ? ''
      : [
          `Monthly payment: ${formatCurrency(result.monthlyPayment)}`,
          `Principal financed: ${formatCurrency(result.principal)}`,
          `Total interest: ${formatCurrency(result.totalInterest)}`,
          `Total paid: ${formatCurrency(result.totalPaid)}`,
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setHomePrice('');
        setDownPayment('');
        setAnnualRate('');
        setTermYears('30');
        setShowFullSchedule(false);
      }}
      options={
        <>
          <div className="options-label">Home Price</div>
          <CalculatorInput
            type="number"
            placeholder="450000"
            value={homePrice}
            onChange={(event) => setHomePrice(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Down Payment</div>
          <CalculatorInput
            type="number"
            placeholder="90000"
            value={downPayment}
            onChange={(event) => setDownPayment(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Annual Interest Rate (%)</div>
          <CalculatorInput
            type="number"
            placeholder="6.5"
            value={annualRate}
            onChange={(event) => setAnnualRate(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Loan Term (Years)</div>
          <CalculatorInput
            type="number"
            placeholder="30"
            value={termYears}
            onChange={(event) => setTermYears(event.target.value)}
            style={{ marginBottom: 20 }}
          />

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={showFullSchedule}
              onChange={(event) => setShowFullSchedule(event.target.checked)}
            />
            <span className="checkbox-label">Show full amortization schedule</span>
          </label>

          <div className="panel-divider" />
          <CalculatorNotice message="Home price minus down payment becomes the financed principal used for the payment and amortization calculations." />
        </>
      }
    >
      <OutputPanel>
        {!hasInput ? (
          <CalculatorEmptyState
            iconName="DollarSign"
            title="Estimate mortgage payments and loan payoff"
            message="Enter a home price, down payment, interest rate, and loan term to see monthly payments, total interest, and a month-by-month amortization view."
          />
        ) : null}

        {isInvalid ? (
          <CalculatorNotice tone="error" message="Use valid loan inputs, and make sure the down payment is not greater than the home price." />
        ) : null}

        {result ? (
          <>
            <CalculatorPrimaryResult
              label="Monthly Payment"
              value={formatCurrency(result.monthlyPayment)}
              detail={`${formatNumber(result.months, { maximumFractionDigits: 0 })} monthly payments`}
            />

            <CalculatorStatGrid
              items={[
                {
                  label: 'Principal Financed',
                  value: formatCurrency(result.principal),
                  detail: 'Home price minus down payment',
                },
                {
                  label: 'Total Interest',
                  value: formatCurrency(result.totalInterest),
                  detail: `${interestShare}% of the total paid`,
                },
                {
                  label: 'Total Paid',
                  value: formatCurrency(result.totalPaid),
                  detail: 'Principal plus total interest',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
            />

            <CalculatorSectionDivider label="Principal vs Interest" />
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 18,
                marginBottom: 18,
              }}
            >
              <div style={{ display: 'flex', height: 14, borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `${100 - interestShare}%`, background: 'var(--success-bg)' }} />
                <div style={{ width: `${interestShare}%`, background: 'var(--warning-bg)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                <span>Principal {formatCurrency(result.principal)}</span>
                <span>Interest {formatCurrency(result.totalInterest)}</span>
              </div>
            </div>

            <CalculatorSectionDivider label="Amortization" />
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.7fr 1fr 1fr 1fr 1fr',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                <div>Month</div>
                <div>Payment</div>
                <div>Principal</div>
                <div>Interest</div>
                <div>Balance</div>
              </div>
              {previewRows.map((row) => (
                <div
                  key={row.month}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.7fr 1fr 1fr 1fr 1fr',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                    color: 'var(--text-dim)',
                  }}
                >
                  <div>{row.month}</div>
                  <div>{formatCurrency(row.payment)}</div>
                  <div>{formatCurrency(row.principalPaid)}</div>
                  <div>{formatCurrency(row.interest)}</div>
                  <div>{formatCurrency(row.balance)}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
