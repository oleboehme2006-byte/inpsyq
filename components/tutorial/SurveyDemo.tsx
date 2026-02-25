'use client';

import React, { useState } from 'react';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';

interface Question {
    id: number;
    dimension: string;
    text: string;
    options: string[];
    highlightedOption: number; // 0-indexed
}

const QUESTIONS: Question[] = [
    {
        id: 1,
        dimension: 'ROLE CLARITY',
        text: 'I have a clear understanding of what is expected of me in my role this week.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        highlightedOption: 3,
    },
    {
        id: 2,
        dimension: 'COGNITIVE LOAD',
        text: 'I felt mentally stretched beyond my comfortable capacity at some point this week.',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        highlightedOption: 2,
    },
    {
        id: 3,
        dimension: 'TRUST — LEADERSHIP',
        text: 'I trust that my team lead makes decisions that consider my wellbeing.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        highlightedOption: 3,
    },
    {
        id: 4,
        dimension: 'WITHDRAWAL SIGNAL',
        text: 'I found myself going through the motions rather than being genuinely engaged.',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        highlightedOption: 1,
    },
    {
        id: 5,
        dimension: 'DEPENDENCY FRICTION',
        text: 'Delays or blockers from other teams impacted my ability to deliver this week.',
        options: ['Not at all', 'Slightly', 'Moderately', 'Significantly', 'Completely'],
        highlightedOption: 2,
    },
    {
        id: 6,
        dimension: 'AUTONOMY',
        text: 'I had sufficient autonomy to make decisions within my area of responsibility.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        highlightedOption: 3,
    },
    {
        id: 7,
        dimension: 'PSYCHOLOGICAL SAFETY',
        text: 'I felt safe to raise concerns or ask questions without fear of judgment.',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        highlightedOption: 3,
    },
    {
        id: 8,
        dimension: 'ENGAGEMENT',
        text: 'I felt a sense of progress and momentum in my work this week.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        highlightedOption: 3,
    },
    {
        id: 9,
        dimension: 'SCOPE OVERLOAD',
        text: 'The scope of my responsibilities felt realistic and manageable this week.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        highlightedOption: 2,
    },
    {
        id: 10,
        dimension: 'BANDWIDTH',
        text: 'If something urgent had come up, I would have had the mental bandwidth to handle it.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        highlightedOption: 2,
    },
];

export function SurveyDemo() {
    const [activeQuestion, setActiveQuestion] = useState(2); // Show question 3 by default (0-indexed)

    const question = QUESTIONS[activeQuestion];

    return (
        <div className="w-full min-h-screen bg-bg-base flex flex-col">
            {/* Header */}
            <div data-tutorial="survey-progress" className="w-full border-b border-white/5 px-8 py-5 flex items-center justify-between">
                <InPsyqLogo size="sm" />
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                        {QUESTIONS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveQuestion(i)}
                                className={`rounded-full transition-all duration-200 ${
                                    i < activeQuestion
                                        ? 'w-2 h-2 bg-[#8B5CF6]'
                                        : i === activeQuestion
                                        ? 'w-4 h-2 bg-[#8B5CF6]'
                                        : 'w-2 h-2 bg-white/15'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-mono text-text-tertiary">
                        {activeQuestion + 1} / {QUESTIONS.length}
                    </span>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-2xl mx-auto w-full py-16">
                {/* Dimension tag */}
                <div data-tutorial="survey-scale" className="w-full mb-6">
                    <span className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-[0.2em]">
                        {question.dimension}
                    </span>
                </div>

                {/* Question text */}
                <div data-tutorial="survey-question" className="w-full mb-10">
                    <p className="text-2xl md:text-3xl font-display font-medium text-white leading-snug">
                        {question.text}
                    </p>
                </div>

                {/* Answer options */}
                <div data-tutorial="survey-options" className="w-full space-y-3">
                    {question.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => {}}
                            className={`w-full text-left px-6 py-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                                i === question.highlightedOption
                                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-white'
                                    : 'bg-white/2 border-white/8 text-text-secondary hover:border-white/15 hover:bg-white/5'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                                i === question.highlightedOption
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]'
                                    : 'border-white/20'
                            }`} />
                            <span className="text-sm font-medium">{option}</span>
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="w-full flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                    <button
                        onClick={() => setActiveQuestion(Math.max(0, activeQuestion - 1))}
                        disabled={activeQuestion === 0}
                        className="text-sm text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-30"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={() => setActiveQuestion(Math.min(QUESTIONS.length - 1, activeQuestion + 1))}
                        disabled={activeQuestion === QUESTIONS.length - 1}
                        className="px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-30"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Anonymity footer */}
            <div className="w-full border-t border-white/5 px-8 py-4 flex items-center justify-center gap-2 text-xs text-text-tertiary font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All responses are anonymized at the team level. Individual answers are never visible to your manager.
            </div>
        </div>
    );
}
