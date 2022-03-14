// A deck.gl custom layer taken from https://observablehq.com/@pessimistress/deck-gl-custom-layer-tutorial
import {CompositeLayer, TextLayer} from './deck-layers';

const defaultProps = {
  ...TextLayer.defaultProps,
  // Text level of detail
  getLevel: {type: "accessor", value: x => x.level },
  // Zoom thresholds
  minZoom: 5.2,
  maxZoom: 8.5,
  // Rate at which to fade labels on transition (fraction of level width)
  fadeRate: 0.5,
};

class LODTextLayer extends CompositeLayer {

  shouldUpdateState({ changeFlags }) {
      return changeFlags.somethingChanged;
  }
  updateState({ changeFlags }) {
    const { data, getLevel } = this.props;
    if (changeFlags.dataChanged && data) {
      const numLevels = Math.max.apply(null, data.map(getLevel));
      var levelData = []
      for (var i=0; i <= numLevels; i++) {
        const level = data.filter(x => getLevel(x) == i);
        levelData.push(level);
      }
      this.setState({ levelData, numLevels });
    }
  }
  renderLayers() {
    const {
      getPosition,
      getText,
      getSize,
      getColor,
      getAngle,
      getTextAnchor,
      getAlignmentBaseline,
      getBackgroundColor,
      getBorderColor,
      getBorderWidth,
      sizeScale,
      sizeUnits,
      billboard,
      background,
      backgroundPadding,
      sizeMinPixels,
      sizeMaxPixels,
      fontFamily,
      fontWeight,
      lineHeight,
      fontSettings,
      outlineWidth,
      outlineColor,
      minZoom,
      maxZoom,
      fadeRate,
    } = this.props;
    const {levelData, numLevels} = this.state;
    const zoom = this.context.viewport.zoom;
    const zoomRatio = 1.0 - ((zoom - minZoom) / (maxZoom - minZoom));
    const levelRatioWidth = 1.0 / numLevels;
    var result = [];
    for (var i=0; i<=numLevels; i++) {
      var levelOpacity = 1.0;
      if ((zoomRatio > -levelRatioWidth) && (zoomRatio < 1.0 - levelRatioWidth)) {
          if (Math.abs(zoomRatio - (i / numLevels)) < 2 * fadeRate * levelRatioWidth) {
            levelOpacity = Math.abs(zoomRatio - (i / numLevels)) / (2 * fadeRate * levelRatioWidth);
          } else if (Math.abs(zoomRatio - ((i - 2) / numLevels)) < 2 * fadeRate * levelRatioWidth) {
            levelOpacity = Math.abs(zoomRatio - ((i - 2) / numLevels)) / (2 * fadeRate * levelRatioWidth);
          }
      }
      result.push(
          new TextLayer(this.getSubLayerProps({ id: "text" }), {
            data: levelData[i],
            id: this.id + "label-level-" + i,
            billboard: billboard,
            sizeScale: sizeScale,
            sizeUnits: sizeUnits,
            sizeMinPixels: sizeMinPixels,
            sizeMaxPixels: sizeMaxPixels,
            background: background,
            backgroundPadding: backgroundPadding,
            getColor: this.getSubLayerAccessor(getColor),
            getPosition: this.getSubLayerAccessor(getPosition),
            getText: this.getSubLayerAccessor(getText),
            getSize: this.getSubLayerAccessor(getSize),
            getAngle: this.getSubLayerAccessor(getAngle),
            getAlignmentBaseline: this.getSubLayerAccessor(getAlignmentBaseline),
            getTextAnchor: this.getSubLayerAccessor(getTextAnchor),
            getBackgroundColor: this.getSubLayerAccessor(getBackgroundColor),
            getBorderColor: this.getSubLayerAccessor(getBorderColor),
            getBorderWidth: this.getSubLayerAccessor(getBorderWidth),
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            lineHeight: lineHeight,
            fontSettings: fontSettings,
            outlineWidth: outlineWidth,
            outlineColor: outlineColor,
            opacity: levelOpacity,
          })
      );
    }
    return result;
  }
  filterSubLayer({layer, viewport}) {
    const { minZoom, maxZoom } = this.props;
    const { numLevels } = this.state;
    
    const zoomRatio = 1.0 - ((viewport.zoom - minZoom) / (maxZoom - minZoom));
    const levelRatioWidth = 1.0 / numLevels;
    
    if (zoomRatio < -levelRatioWidth) {
        return layer.id === this.id + 'label-level-0';
    } else if (zoomRatio > 1.0) {
    	return layer.id === this.id + 'label-level-' + numLevels;
    } else {
        for (var i=0; i <= numLevels ; i++) {
            if (zoomRatio <= (i / numLevels)) {
                return layer.id === this.id + 'label-level-' + i || layer.id == this.id + 'label-level-' + (i+1);
            }
        }
    }
    return layer.id === this.id + 'label-level-' + numLevels;
  }
}

LODTextLayer.layerName = "LODTextLayer";
LODTextLayer.defaultProps = defaultProps;

export { LODTextLayer };
