/** External Dependencies */
import React from 'react';
import PropTypes from 'prop-types';

/** Internal Dependencies */
import restrictNumber from 'utils/restrictNumber';
import { SET_LATEST_STROKE_WIDTH } from 'actions/setLatestStrokeWidth';
import ColorInput from 'components/common/ColorInput';
import { useStore } from 'hooks';
import { StyledSpacedOptionFields } from './AnnotationOptions.styled';
import Slider from '../Slider';

const MIN_PERCENTANGE = 0;
const MAX_PERCENTANGE = 100;

const StrokeFields = ({ annotation, updateAnnotation }) => {
  const { dispatch, latestStrokeWidths } = useStore();
  const { stroke, strokeWidth } = annotation;

  const changeStrokeWidth = (newStrokeWidth) => {
    updateAnnotation({
      strokeWidth: restrictNumber(
        newStrokeWidth,
        MIN_PERCENTANGE,
        MAX_PERCENTANGE,
      ),
    });
    dispatch({
      type: SET_LATEST_STROKE_WIDTH,
      payload: {
        latestStrokeWidths: {
          default: restrictNumber(
            newStrokeWidth,
            MIN_PERCENTANGE,
            MAX_PERCENTANGE,
          ),
        },
      },
    });
  };

  const changeStrokeColor = (newStrokeColor) => {
    updateAnnotation({ stroke: newStrokeColor });
  };

  return (
    <StyledSpacedOptionFields>
      <Slider
        annotation="px"
        onChange={changeStrokeWidth}
        value={latestStrokeWidths?.default || strokeWidth}
        noMargin
      />
      <ColorInput
        color={stroke}
        onChange={changeStrokeColor}
        colorFor="stroke"
      />
    </StyledSpacedOptionFields>
  );
};

StrokeFields.propTypes = {
  annotation: PropTypes.instanceOf(Object).isRequired,
  updateAnnotation: PropTypes.func.isRequired,
};

export default StrokeFields;
