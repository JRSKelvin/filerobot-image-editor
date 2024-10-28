export const SET_LATEST_STROKE_WIDTH = 'SET_LATEST_STROKE_WIDTH';

const setLatestStrokeWidth = (state, payload) => ({
  ...state,
  latestStrokeWidths: {
    ...state.latestStrokeWidths,
    ...payload.latestStrokeWidths,
  },
});

export default setLatestStrokeWidth;
