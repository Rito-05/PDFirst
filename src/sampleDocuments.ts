// src/sampleDocuments.ts - Realistic sample documents for PDFirst
import { DocumentModel, DEFAULT_PAGE_SETTINGS } from './types/document';

export const SAMPLE_DOCUMENTS: DocumentModel[] = [
  {
    schemaVersion: 1,
    metadata: {
      id: 'sample-project-brief',
      title: 'Executive Project Brief — Q4 Modernization',
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 1,
      version: 1,
      wordCount: 320,
      characterCount: 2150,
      pageCount: 1
    },
    settings: { ...DEFAULT_PAGE_SETTINGS },
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Executive Project Brief: Digital Modernization' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This document provides an executive summary of the quarterly operations and customer workflow modernization project for senior leadership.' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Project Objectives' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Accelerate document publishing speed across departments by 65%.' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Eliminate costly proprietary PDF editor seat licenses for non-technical team members.' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ensure strict client data privacy by moving document compilation 100% in-browser.' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '2. Implementation Milestones' }]
        },
        {
          type: 'table',
          attrs: { hasHeaderRow: true },
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Deliverable' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Target Date' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 1' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Architecture & Editor Scaffolding' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Oct 15' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complete' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 2' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Vector PDF Compilation Engine' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nov 01' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'In Progress' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 3' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Digital PDF Text Extraction' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nov 18' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Planned' }] }] }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '3. Strategic Value' }]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '“By making the reflowable document our single source of truth, teams can draft freely without worrying about breaking page coordinates or overflowing margins.”' }]
            }
          ]
        }
      ]
    }
  },
  {
    schemaVersion: 1,
    metadata: {
      id: 'sample-client-proposal',
      title: 'Consulting Proposal — Strategic Advisory',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
      version: 1,
      wordCount: 280,
      characterCount: 1840,
      pageCount: 1
    },
    settings: {
      ...DEFAULT_PAGE_SETTINGS,
      marginPreset: 'compact',
      margins: { top: 36, right: 36, bottom: 36, left: 36 }
    },
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Consulting Services Agreement' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Prepared for: Acme Enterprise Solutions' },
            { type: 'text', text: ' | Date: September 2026' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Scope of Work' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The consultant agrees to provide strategic analysis, software architecture design, and technical oversight for the client’s cloud migration initiative.' }
          ]
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Comprehensive assessment of existing on-premise document stores.' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Establishment of automated validation pipelines and local testing regimes.' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Staff onboarding and documentation handover.' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Investment & Terms' }]
        },
        {
          type: 'table',
          attrs: { hasHeaderRow: true },
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hours' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rate' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Total' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Architecture Design' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '40' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '$175/hr' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '$7,000' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pipeline Implementation' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '60' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '$175/hr' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '$10,500' }] }] }
              ]
            }
          ]
        }
      ]
    }
  }
];
