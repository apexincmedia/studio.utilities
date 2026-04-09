'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorInput,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorSelect,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import { formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

const SCALE_MAPS = {
  '4.0': {
    'A+': 4,
    A: 4,
    'A-': 3.7,
    'B+': 3.3,
    B: 3,
    'B-': 2.7,
    'C+': 2.3,
    C: 2,
    'C-': 1.7,
    'D+': 1.3,
    D: 1,
    F: 0,
  },
  '4.3': {
    'A+': 4.3,
    A: 4,
    'A-': 3.7,
    'B+': 3.3,
    B: 3,
    'B-': 2.7,
    'C+': 2.3,
    C: 2,
    'C-': 1.7,
    'D+': 1.3,
    D: 1,
    F: 0,
  },
};

function createCourse(id) {
  return {
    id,
    name: '',
    grade: 'A',
    credits: '',
    semester: 'Semester 1',
  };
}

function calculateGpa(courses, scale) {
  const validCourses = courses.filter((course) => safeNumber(course.credits) && SCALE_MAPS[scale][course.grade] !== undefined);
  if (!validCourses.length) return null;

  const totals = validCourses.reduce(
    (accumulator, course) => {
      const credits = safeNumber(course.credits);
      const points = SCALE_MAPS[scale][course.grade];
      accumulator.credits += credits;
      accumulator.points += points * credits;
      accumulator.bySemester[course.semester] = accumulator.bySemester[course.semester] || { credits: 0, points: 0 };
      accumulator.bySemester[course.semester].credits += credits;
      accumulator.bySemester[course.semester].points += points * credits;
      return accumulator;
    },
    { credits: 0, points: 0, bySemester: {} }
  );

  return {
    overall: totals.points / totals.credits,
    totalCredits: totals.credits,
    courseCount: validCourses.length,
    semesters: Object.entries(totals.bySemester).map(([semester, values]) => ({
      label: semester,
      value: values.points / values.credits,
      credits: values.credits,
    })),
  };
}

export default function GpaCalculator() {
  const [scale, setScale] = useState('4.0');
  const [courses, setCourses] = useState([createCourse(1)]);

  const result = calculateGpa(courses, scale);
  const hasInput = courses.some((course) => course.credits || course.name);
  const copyValue =
    result === null
      ? ''
      : [
          `Overall GPA: ${formatNumber(result.overall, { maximumFractionDigits: 2 })}`,
          `Total credits: ${formatNumber(result.totalCredits, { maximumFractionDigits: 1 })}`,
          ...result.semesters.map((semester) => `${semester.label}: ${formatNumber(semester.value, { maximumFractionDigits: 2 })} GPA`),
        ].join('\n');

  const updateCourse = (id, key, value) => {
    setCourses((current) => current.map((course) => (course.id === id ? { ...course, [key]: value } : course)));
  };

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setScale('4.0');
        setCourses([createCourse(1)]);
      }}
      options={
        <>
          <div className="options-label">Grade Scale</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`mode-btn${scale === '4.0' ? ' active' : ''}`}
              onClick={() => setScale('4.0')}
            >
              4.0
            </button>
            <button
              type="button"
              className={`mode-btn${scale === '4.3' ? ' active' : ''}`}
              onClick={() => setScale('4.3')}
            >
              4.3
            </button>
          </div>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}
            onClick={() => setCourses((current) => [...current, createCourse(Date.now())])}
          >
            <Icon icon={ICON_MAP.Plus} size={14} />
            Add Course
          </button>

          <div className="panel-divider" />
          <CalculatorNotice message="Add courses from one or multiple semesters. GPA is weighted by credit hours, not by the raw course count." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Courses
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {courses.map((course, index) => (
            <div
              key={course.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>Course {index + 1}</div>
                {courses.length > 1 ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCourses((current) => current.filter((entry) => entry.id !== course.id))}
                    style={{ minWidth: 40, display: 'flex', justifyContent: 'center', padding: '8px 10px' }}
                  >
                    <Icon icon={ICON_MAP.X} size={14} />
                  </button>
                ) : null}
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <CalculatorField label="Name">
                  <CalculatorInput
                    placeholder="Calculus"
                    value={course.name}
                    onChange={(event) => updateCourse(course.id, 'name', event.target.value)}
                  />
                </CalculatorField>
                <CalculatorField label="Grade">
                  <CalculatorSelect
                    value={course.grade}
                    onChange={(event) => updateCourse(course.id, 'grade', event.target.value)}
                  >
                    {Object.keys(SCALE_MAPS[scale]).map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </CalculatorSelect>
                </CalculatorField>
                <CalculatorField label="Credits">
                  <CalculatorInput
                    type="number"
                    placeholder="3"
                    value={course.credits}
                    onChange={(event) => updateCourse(course.id, 'credits', event.target.value)}
                  />
                </CalculatorField>
                <CalculatorField label="Semester">
                  <CalculatorInput
                    placeholder="Semester 1"
                    value={course.semester}
                    onChange={(event) => updateCourse(course.id, 'semester', event.target.value || 'Semester 1')}
                  />
                </CalculatorField>
              </div>
            </div>
          ))}

          {!hasInput ? (
            <CalculatorEmptyState
              iconName="BarChart2"
              title="Calculate weighted GPA across multiple semesters"
              message="Add your courses, choose each letter grade, and enter the corresponding credit hours to get a live cumulative GPA."
            />
          ) : null}

          {hasInput && !result ? (
            <CalculatorNotice tone="error" message="Enter credit hours for at least one course to calculate GPA." />
          ) : null}

          {result ? (
            <>
              <CalculatorPrimaryResult
                label="Overall GPA"
                value={formatNumber(result.overall, { maximumFractionDigits: 2 })}
                detail={`${formatNumber(result.totalCredits, { maximumFractionDigits: 1 })} total credit hours`}
              />

              <CalculatorStatGrid
                items={[
                  {
                    label: 'Courses Counted',
                    value: String(result.courseCount),
                    detail: 'Courses with credits entered',
                  },
                  {
                    label: 'Scale',
                    value: scale,
                    detail: 'Selected GPA scale',
                  },
                ]}
              />

              <CalculatorSectionDivider label="Semester Breakdown" />
              <CalculatorStatGrid
                items={result.semesters.map((semester) => ({
                  label: semester.label,
                  value: formatNumber(semester.value, { maximumFractionDigits: 2 }),
                  detail: `${formatNumber(semester.credits, { maximumFractionDigits: 1 })} credits`,
                }))}
              />
            </>
          ) : null}
        </div>
      </OutputPanel>
    </CalculatorShell>
  );
}
