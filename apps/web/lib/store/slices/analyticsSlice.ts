import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AnalyticsState {
  dateRange: '7d' | '30d' | '90d' | 'year';
  platformFilter: string;
  metricComparisonEnabled: boolean;
}

const initialState: AnalyticsState = {
  dateRange: '30d',
  platformFilter: 'all',
  metricComparisonEnabled: false,
};

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<'7d' | '30d' | '90d' | 'year'>) => {
      state.dateRange = action.payload;
    },
    setPlatformFilter: (state, action: PayloadAction<string>) => {
      state.platformFilter = action.payload;
    },
    toggleMetricComparison: (state) => {
      state.metricComparisonEnabled = !state.metricComparisonEnabled;
    },
  },
});

export const { setDateRange, setPlatformFilter, toggleMetricComparison } = analyticsSlice.actions;

export default analyticsSlice.reducer;
