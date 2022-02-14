/** External Dependeices */
import React from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@scaleflex/ui/core/menu-item';

/** Internal Dependeices */
import { StyledMenuItemIcon, StyledRatioDescription } from './Crop.styled';

const PREFIX_ICONS_DIMENS = { height: 16, width: 16 };

const CropPresetItem = ({
  title,
  description,
  ratio,
  onClick,
  Icon,
  isActive,
  width,
  height,
}) => {
  const handleOnClick = (e) =>
    onClick(e, ratio, { ratioTitle: title, width, height });

  return (
    <MenuItem active={isActive} onClick={handleOnClick} size="sm">
      {Icon && (
        <StyledMenuItemIcon>
          {typeof Icon === 'string' ? (
            // eslint-disable-next-line react/no-danger
            <span dangerouslySetInnerHTML={{ __html: Icon }} />
          ) : (
            <Icon {...PREFIX_ICONS_DIMENS} />
          )}
        </StyledMenuItemIcon>
      )}
      {title}
      {description && (
        <StyledRatioDescription>{description}</StyledRatioDescription>
      )}
    </MenuItem>
  );
};

CropPresetItem.defaultProps = {
  Icon: undefined,
  width: undefined,
  height: undefined,
};

CropPresetItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
  ratio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  Icon: PropTypes.oneOfType([
    PropTypes.elementType,
    PropTypes.string,
    PropTypes.instanceOf(HTMLElement),
  ]),
};

export default CropPresetItem;
