import {
  NgxAlignmentConst,
  NgxDensityConst,
  NgxPaginationModeConst,
  NgxRowSelectionConst,
  NgxSortDirectionConst
} from '../constants';

export type NgxRowSelection = keyof typeof NgxRowSelectionConst;
export type NgxSortDirection = keyof typeof NgxSortDirectionConst;
export type NgxAlignment = keyof typeof NgxAlignmentConst;
export type NgxPaginationMode = keyof typeof NgxPaginationModeConst;
export type NgxDensity = keyof typeof NgxDensityConst;
export type NgxFilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';
