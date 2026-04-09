'use client';

import { useState } from 'react';
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
import { formatCurrency, formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

const FREQUENCIES = {
  annual: { label: 'Annual', periodsPerYear: 1 },
  quarterly: { label: 'Quarterly', periodsPerYear: 4 },
  monthly: { label: 'Monthly', periodsPerYear: 12 },
  daily: { label: 'Daily', periodsPerYear: 365 },
};

function calculateCompoundGrowth(principal, annualRate, years, frequencyKey, monthlyContribution) {
  if (principal < 0 || annualRate < 0 || years <= 0 || monthlyContribution < 0) return null;

  const frequency = FREQUENCIES[frequencyKey];
  const months = Math.round(years * 12);
  const effectiveMonthlyRate =
    Math.pow(1 + annualRate / 100 / frequency.periodsPerYear, frequency.periodsPerYear / 12) - 1;

  let balance = principal;
  const timeline = [];

  for (let month = 1; month <= months; month += 1) {
    balance *= 1 + effectiveMonthlyRate;
    balance += monthlyContribution;

    if (month % 12 === 0 || month === months) {
      const invested = principal + monthlyContribution * month;
      timeline.push({
        year: month / 12,
        balance,
        invested,
        interest: balance - invested,
      });
    }
  }

  const invested = principal + monthlyContribution * months;
  return {
    finalBalance: balance,
    totalInvested: invested,
    totalInterest: balance - invested,
    timeline,
  };
}

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [years, setYears] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [monthlyContribution, setMonthlyContribution] = useState('0');

  const numericPrincipal = safeNumber(principal);
  const numericRate = safeNumber(annualRate);
  const numericYears = safeNumber(years);
  const numericContribution = safeNumber(monthlyContribution) ?? 0;
  const result =
    numericPrincipal !== null && numericRate !== null && numericYears !== null
      ? calculateCompoundGrowth(numericPrincipal, numericRate, numericYears, frequency, numericContribution)
      : null;
  const hasInput = Boolean(principal || annualRate || years);
  const isInvalid = hasInput && result === null;
  const copyValue =
    result === null
      ? ''
      : [
          `Final balance: ${formatCurrency(result.finalBalance)}`,
          `Total invested: ${formatCurrency(result.totalInvested)}`,
          `Interest earned: ${formatCurrency(result.totalInterest)}`,
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setPrincipal('');
        setAnnualRate('');
        setYears('');
        setFrequency('monthly');
        setMonthlyContribution('0');
      }}
      options={
        <>
          <div className="options-label">Starting Principal</div>
          <CalculatorInput
            type="number"
            placeholder="10000"
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Annual Rate (%)</div>
          <CalculatorInput
            type="number"
            placeholder="7"
            value={annualRate}
            onChange={(event) => setAnnualRate(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Years</div>
          <CalculatorInput
            type="number"
            placeholder="20"
            value={years}
            onChange={(event) => setYears(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Compound Frequency</div>
          <CalculatorSelect
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            {Object.entries(FREQUENCIES).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">Monthly Contribution</div>
          <CalculatorInput
            type="number"
            placeholder="250"
            value={monthlyContribution}
            onChange={(event) => setMonthlyContribution(event.target.value)}
            style={{ marginBottom: 20 }}
          />

          <div className="panel-divider" />
          <CalculatorNotice message="Monthly contributions are simulated month by month so the growth table reflects recurring deposits over time." />
        </>
      }
    >
      <OutputPanel>
        {!hasInput ? (
          <CalculatorEmptyState
            iconName="TrendingUp"
            title="Project long-term savings growth"
            message="Set your principal, interest rate, investment horizon, and monthly contribution to see total growth year by year."
          />
        ) : null}

        {isInvalid ? (
          <CalculatorNotice tone="error" message="Enter non-negative amounts and a positive time horizon to calculate compound growth." />
        ) : null}

        {result ? (
          <>
            <CalculatorPrimaryResult
              label="Final Balance"
              value={formatCurrency(result.finalBalance)}
              detail={`${FREQUENCIES[frequency].label} compounding`}
            />

            <CalculatorStatGrid
              items={[
                {
                  label: 'Total Invested',
                  value: formatCurrency(result.totalInvested),
                  detail: 'Principal plus contributions',
                },
                {
                  label: 'Interest Earned',
                  value: formatCurrency(result.totalInterest),
                  detail: 'Growth beyond deposits',
                },
              ]}
            />

            <CalculatorSectionDivider label="Year-by-Year Growth" />
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.7fr 1fr 1fr 1fr',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                <div>Year</div>
                <div>Balance</div>
                <div>Invested</div>
                <div>Interest</div>
              </div>
              {result.timeline.map((row) => (
                <div
                  key={row.year}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.7fr 1fr 1fr 1fr',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                    color: 'var(--text-dim)',
                  }}
                >
                  <div>{formatNumber(row.year, { maximumFractionDigits: 1 })}</div>
                  <div>{formatCurrency(row.balance)}</div>
                  <div>{formatCurrency(row.invested)}</div>
                  <div>{formatCurrency(row.interest)}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
