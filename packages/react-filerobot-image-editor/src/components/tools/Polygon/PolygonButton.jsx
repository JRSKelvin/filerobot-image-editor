/** External Dependencies */
import React from 'react';
import PropTypes from 'prop-types';
import { Resize } from '@scaleflex/icons';

/** Internal Dependencies */
import ToolsBarItemButton from 'components/ToolsBar/ToolsBarItemButton';
import { TOOLS_IDS } from 'utils/constants';

const PolygonButton = ({ selectTool, isSelected, t }) => (
  <ToolsBarItemButton
    className="FIE_polygon-tool-button"
    id={TOOLS_IDS.SELECT}
    label={"Select"}
    Icon={Resize}
    onClick={selectTool}
    isSelected={isSelected}
  />
);

PolygonButton.defaultProps = {
  isSelected: false,
};

PolygonButton.propTypes = {
  selectTool: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default PolygonButton;
