/** External Dependencies */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import Konva from 'konva';
import { useStrictMode } from 'react-konva';

/** Internal Dependencies */
import {
  CHANGE_POINTER_ICON,
  CLEAR_ANNOTATIONS_SELECTIONS,
  ZOOM_CANVAS,
  SELECT_ANNOTATION,
  ENABLE_TEXT_CONTENT_EDIT
} from 'actions';
import {
  DEFAULT_ZOOM_FACTOR,
  POINTER_ICONS,
  TABS_IDS,
  TOOLS_IDS,
} from 'utils/constants';
import { useStore } from 'hooks';
import { endTouchesZooming, zoomOnTouchesMove } from './touchZoomingEvents';
import { StyledCanvasNode } from './MainCanvas.styled';

const ZOOM_DELTA_TO_SCALE_CONVERT_FACTOR = 0.006;

const CanvasNode = ({ children }) => {
  useStrictMode(true);
  const canvasRef = useRef();
  const {
    dispatch,
    pointerCssIcon,
    tabId,
    toolId,
    canvasWidth,
    canvasHeight,
    canvasScale,
    textIdOfEditableContent,
    annotations = {},
    selectionsIds = [],
    zoom = {},
    config: { previewPixelRatio, disableZooming },
  } = useStore();
  Konva.pixelRatio = previewPixelRatio;
  const defaultZoomFactor = DEFAULT_ZOOM_FACTOR;
  const isZoomEnabled = !disableZooming && toolId !== TOOLS_IDS.CROP;
  const [isPanningEnabled, setIsPanningEnabled] = useState(
    tabId !== TABS_IDS.ANNOTATE &&
      tabId !== TABS_IDS.WATERMARK &&
      zoom.factor > defaultZoomFactor,
  );
  const [selectionRectangle, setSelectionRectangle] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isClick, setIsClick] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [target, setTarget] = useState(null);

  const cursorStyle = useMemo(
    () => ({
      cursor:
        pointerCssIcon === POINTER_ICONS.DEFAULT && tabId === TABS_IDS.ANNOTATE
          ? POINTER_ICONS.DRAW
          : pointerCssIcon,
    }),
    [tabId, pointerCssIcon],
  );

  const saveZoom = (newZoomProps) => {
    dispatch({
      type: ZOOM_CANVAS,
      payload: newZoomProps,
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete") {
        // Find the div with class 'FIE_annotation-controls-overlay'
        const overlayDiv = document.querySelector('.FIE_annotation-controls-overlay');
        
        if (overlayDiv) {
          // Find all buttons inside this div
          const buttons = overlayDiv.querySelectorAll('button');
          
          if (buttons.length >= 2) {
            // Click the second button
            buttons[1].click();
          }
        }
      }
    };
  
    // Add event listener for 'keydown' event
    document.addEventListener('keydown', handleKeyDown);
  
    // Clean up the event listener when the component is unmounted
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef) {
      return;
    }

    if (toolId !== "Polygon") {
      return;
    }

    const stage = canvasRef.current;
    const layers = stage.getLayers(); 
    const layer = layers[0];

    // Create a new selection rectangle
    const newRect = new Konva.Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
      listening: false,
      name: "highlight-rect"
    });
    layer.add(newRect);

    setSelectionRectangle(newRect);
  }, [canvasRef, toolId]);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    setHasMoved(false);

    if (selectionRectangle && toolId === "Polygon") {
      const stage = e.target.getStage();
      // const pointerPosition = stage.getPointerPosition(); // Fix pointer position
      const layers = stage.getLayers(); 
      if (layers.length > 0) {
        const layer = layers[0];
        const pointerPosition = layer.getRelativePointerPosition();
  
        setSelectionBox({
          visible: true,
          x: pointerPosition.x,
          y: pointerPosition.y,
          width: 0,
          height: 0,
        });
        setSelecting(true);
        selectionRectangle.visible(true); // Show the rectangle
        selectionRectangle.setAttrs({
          x: pointerPosition.x,
          y: pointerPosition.y,
          width: 0,
          height: 0,
        });
      }
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDrawing) {
      setHasMoved(true);
    }

    if (!selecting) return;
    e.evt.preventDefault();
  
    const stage = e.target.getStage();
    const layers = stage.getLayers(); 
    if (layers.length > 0) {
      const layer = layers[0];
      const pointerPosition = layer.getRelativePointerPosition();
    
      const newX = Math.min(selectionBox.x, pointerPosition.x);
      const newY = Math.min(selectionBox.y, pointerPosition.y);
      const newWidth = Math.abs(pointerPosition.x - selectionBox.x);
      const newHeight = Math.abs(pointerPosition.y - selectionBox.y);
    
      // Update the rectangle position and size
      selectionRectangle.setAttrs({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  };
  
  const handleMouseUp = (e) => {
    setTimeout(() => {
      setIsDrawing(false);
      setHasMoved(false); 
    }, 100);

    if (!selecting) return;
      setSelecting(false);
      selectionRectangle.visible(false); 
      const { x, y, width, height } = selectionRectangle.attrs;
  
      const box = {
        left: Math.min(x, x + width),
        right: Math.max(x, x + width),
        top: Math.min(y, y + height),
        bottom: Math.max(y, y + height),
      };

      // // Update selected items
      const selectedItems = Object.keys(annotations).map(key => {
        const item = annotations[key];
        const itemBox = {
          left: item.x,
          right: item.x + item.width,
          top: item.y,
          bottom: item.y + item.height,
        };
  
        const isInside =
          itemBox.right > box.left &&
          itemBox.left < box.right &&
          itemBox.bottom > box.top &&
          itemBox.top < box.bottom;
  
        return { ...item, selected: isInside };
      });

      const stage = e.target.getStage();
      const layers = stage.getLayers(); 
      if (layers.length > 1) {
        
        const layerObject = layers[0];
        const layerTF = layers[1].children[0];
        const shapes = layerObject.children.filter(f => f.attrs.id !== "FIE_original-image" && f.attrs.name !== "highlight-rect");
        const rectBox = selectionRectangle.getClientRect();
        
        const selected = shapes.filter((shape) =>
          Konva.Util.haveIntersection(rectBox, shape.getClientRect())
        );

        selected.map((shape) => {
          shape.draggable(true);

          dispatch({
            type: SELECT_ANNOTATION,
            payload: {
              annotationId: shape.attrs.id,
              multiple: true,
            },
          });
        });

        layerTF.nodes(selected);

        setTimeout(() => {
          dispatch({ 
            type: CHANGE_POINTER_ICON,
            payload: {
              pointerCssIcon: POINTER_ICONS.MOVE,
            },
          });
        }, 1000)
      }
  
      // setItems(updatedItems);
      setSelectionBox({ startX: 0, startY: 0, width: 0, height: 0 });
  };

  const handleCanvasDragEnd = (e) => {
    if (
      e.currentTarget.draggable() &&
      e.target.nodeType.toLowerCase() === 'stage' &&
      isZoomEnabled &&
      isPanningEnabled
    ) {
      saveZoom({
        factor: zoom.factor,
        x: e.target.x(),
        y: e.target.y(),
        preparedDimensions: true,
      });
    }
  };

  useEffect(() => {
    if (isClick === true) {
      if (!hasMoved && target) {
        const prototype = Object.getPrototypeOf(target);

        if (
          textIdOfEditableContent &&
          selectionsIds.length === 1 &&
          selectionsIds[0].startsWith('Text-')
        ) {
          console.log('Text', 'Text Editing');
        } else if (
          (target.constructor.name === 'Image' || prototype?.className === "Image") &&
          selectionsIds.length > 0 &&
          target.attrs.id === 'FIE_original-image'
        ) {
          console.log("Image", 'Clear Selection Canvas Successfully');
          dispatch({
            type: CLEAR_ANNOTATIONS_SELECTIONS,
          });
        }
      }
      setIsClick(false);
      setTarget(null);
    }
  }, [isDrawing, hasMoved, isClick, target]);

  const clearSelections = (e) => {
    e.evt.preventDefault();
    e.currentTarget.container?.().focus();
    setIsClick(true);
    setTarget(e.target);
  }

  // const clearSelections = useCallback(
  //   (e) => {
  //     e.evt.preventDefault();
  //     e.currentTarget.container?.().focus();

  //     const isDrawing = localStorage.getItem("isDrawing");
  //     console.log(isDrawing);
  //     if (!isDrawing) {
  //       const prototype = Object.getPrototypeOf(e.target);

  //       if (
  //         (e.target.constructor.name === 'Image' || prototype?.className === "Image") &&
  //         selectionsIds.length > 0 &&
  //         e.target.attrs.id === 'FIE_original-image'
  //       ) {
  //         console.log("Image", 'Clear Selection Canvas Successfully');
  //         dispatch({
  //           type: CLEAR_ANNOTATIONS_SELECTIONS,
  //         });
  //       }

  //       if (e.target.constructor.name === 'Stage' && selectionsIds.length > 0) {
  //         console.log("Stage", 'Clear Selection Canvas Successfully');
  //         dispatch({
  //           type: CLEAR_ANNOTATIONS_SELECTIONS,
  //         });
  //       }
  //     }
  //   },
  //   [selectionsIds],
  // );

  const dragBoundFunc = (pos) => {
    const x = Math.min(0, Math.max(pos.x, canvasWidth * (1 - zoom.factor)));
    const y = Math.min(0, Math.max(pos.y, canvasHeight * (1 - zoom.factor)));

    return {
      x,
      y,
    };
  };

  const handleZoom = (e) => {
    e.evt.preventDefault();
    const newScale =
      (zoom.factor || defaultZoomFactor) +
      e.evt.deltaY * -ZOOM_DELTA_TO_SCALE_CONVERT_FACTOR;

    const pointer = e.currentTarget.getPointerPosition();

    saveZoom({
      ...pointer,
      factor: newScale,
    });
  };

  const preventDraggingIfMultiTouches = (e) => {
    if (e.evt.touches?.length > 1) {
      setIsPanningEnabled(false);
    }
  };

  const resetPanningAbility = () =>
    setIsPanningEnabled(
      tabId !== TABS_IDS.ANNOTATE || tabId === TABS_IDS.WATERMARK,
    );

  const endTouchesZoomingEnablePanning = () => {
    endTouchesZooming(resetPanningAbility);
  };

  const mapKeyboardKeys = (e) => {
    if (
      (e.code === 'Space' || e.key === 'Control') &&
      !e.repeat &&
      zoom.factor > defaultZoomFactor &&
      isZoomEnabled
    ) {
      e.preventDefault();
      setIsPanningEnabled(true);
      dispatch({
        type: CHANGE_POINTER_ICON,
        payload: {
          pointerCssIcon: POINTER_ICONS.DRAG,
        },
      });
    }
  };

  const revertKeyboardKeysEffect = (e) => {
    if (e.code === 'Space' || e.key === "Control") {
      e.preventDefault();
      setIsPanningEnabled(false);

      dispatch({
        type: CHANGE_POINTER_ICON,
        payload: {
          pointerCssIcon: POINTER_ICONS['DRAG'],
        },
      });
    }
  };

  const focusCanvasOnEnter = () => {
    if (canvasRef.current) {
      canvasRef.current.container().focus();
    }
  };

  useEffect(() => {
    dispatch({
      type: CHANGE_POINTER_ICON,
      payload: {
        pointerCssIcon: POINTER_ICONS[isPanningEnabled ? 'DRAG' : 'DEFAULT'],
      },
    });
  }, [isPanningEnabled]);

  useEffect(() => {
    dispatch({
      type: CHANGE_POINTER_ICON,
      payload: {
        pointerCssIcon: POINTER_ICONS['DRAW'],
      },
    });
  }, [toolId]);

  // useEffect(() => {
  //   const annotationKeys = Object.keys(annotations);
  //   if (annotationKeys.length > 0) {
  //     const lastAnnotation = annotations[annotationKeys[annotationKeys.length - 1]];
  //     if (lastAnnotation && lastAnnotation.name === "Text") {
  //       dispatch({
  //         type: ENABLE_TEXT_CONTENT_EDIT,
  //         payload: {
  //           textIdOfEditableContent: lastAnnotation.id,
  //         },
  //       });
  //     }
  //   }
  // }, [annotations]);

  // useEffect(() => {
  //   if (toolId === "Polygon") {
  //     dispatch({
  //       type: CHANGE_POINTER_ICON,
  //       payload: {
  //         pointerCssIcon: POINTER_ICONS['DEFAULT'],
  //       },
  //     });
  //   }
  // }, [toolId, annotations, selectionsIds]);

  useEffect(() => {
    setIsPanningEnabled(
      tabId !== TABS_IDS.ANNOTATE &&
        tabId !== TABS_IDS.WATERMARK &&
        zoom.factor > defaultZoomFactor,
    );

    // Remove & register the event on changing tabId, zoom.factor, defaultZoomFactor to always access latest state.
    let canvasContainer;
    if (canvasRef.current) {
      canvasContainer = canvasRef.current.container();
      canvasContainer.addEventListener('mouseenter', focusCanvasOnEnter);
      canvasContainer.addEventListener('keydown', mapKeyboardKeys);
      canvasContainer.addEventListener('keyup', revertKeyboardKeysEffect);
    }

    return () => {
      if (canvasContainer) {
        canvasContainer.removeEventListener('mouseenter', focusCanvasOnEnter);
        canvasContainer.removeEventListener('keydown', mapKeyboardKeys);
        canvasContainer.removeEventListener('keyup', revertKeyboardKeysEffect);
        // canvasContainer.removeEventListener('click');
      }
    };
  }, [tabId, zoom.factor, defaultZoomFactor]);

  // Zoom panning is done by dragging mouse except in annotate tab,
  // it's done by toggling panning through mouse right click (enable/disable) then drag mouse.
  const zoomedResponsiveCanvasScale =
    canvasScale * ((isZoomEnabled && zoom.factor) || defaultZoomFactor);
  return (
    <StyledCanvasNode
      className="FIE_canvas-node"
      tabIndex={-1}
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      scaleX={zoomedResponsiveCanvasScale}
      scaleY={zoomedResponsiveCanvasScale}
      x={(isZoomEnabled && zoom.x) || null}
      y={(isZoomEnabled && zoom.y) || null}
      zoomFactor={(isZoomEnabled && zoom.factor) || defaultZoomFactor}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={isZoomEnabled ? handleZoom : undefined}
      onTap={clearSelections}
      onClick={clearSelections}
      onTouchMove={
        isZoomEnabled ? (e) => zoomOnTouchesMove(e, saveZoom) : undefined
      }
      onDragStart={preventDraggingIfMultiTouches}
      onTouchEnd={isZoomEnabled ? endTouchesZoomingEnablePanning : undefined}
      dragBoundFunc={dragBoundFunc}
      draggable={isZoomEnabled && isPanningEnabled}
      onDragEnd={handleCanvasDragEnd}
      style={{cursor: pointerCssIcon}}
    >
      {children}
    </StyledCanvasNode>
  );
};

CanvasNode.propTypes = {
  children: PropTypes.node.isRequired,
};

export default memo(CanvasNode);
