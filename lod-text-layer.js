// A deck.gl custom layer taken from https://observablehq.com/@pessimistress/deck-gl-custom-layer-tutorial
import * as turf from "@turf/turf";

import {CompositeLayer, TextLayer} from './deck-layers';

const defaultProps = {
  // Position for text layers
  getPosition: {type: "accessor", value: p => [p.x, p.y]},
  // Text level of detail
  getLevel: {type: "accessor", value: x => x.level },
  // Label for each feature
  getLabel: { type: "accessor", value: x => x.text },
  // Label size for each feature
  getLabelSize: { type: "accessor", value: 32 },
  // Label color for each feature
  getLabelColor: { type: "accessor", value: [0, 0, 0, 255] },
  // Label always facing the camera
  billboard: true,
  // Label size units
  labelSizeUnits: "pixels",
  // Label background color
  labelBackground: { type: "color", value: null, optional: true },
  // Label font
  fontFamily: "Monaco, monospace",
  // Label font settings
  fontSettings: { sdf: true, fontSize: 256, radius: 24 },
  // Zoom threshold
  minZoom: 5.2,
  maxZoom: 8.5,
};

class LODTextLayer extends CompositeLayer {
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
      getLabel,
      getLabelSize,
      getLabelColor,
      labelSizeUnits,
      labelBackground,
      billboard,
      fontFamily,
      fontSettings,
      outlineWidth,
      outlineMaxPixels,
      outlineColor,
    } = this.props;
    const {levelData, numLevels} = this.state;
    var result = [];
    for (var i=0; i<=numLevels; i++) {
      result.push(
          new TextLayer(this.getSubLayerProps({ id: "text" }), {
            data: levelData[i],
            id: "label-level-" + i,
            billboard: true,
            sizeUnits: labelSizeUnits,
            getColor: [24 * i, 24 * i, 24 * i], // TODO: Take colors at levels
            getPosition: this.getSubLayerAccessor(getPosition), // d => [d.x, d.y],
            getText: this.getSubLayerAccessor(getLabel),
            getSize: this.getSubLayerAccessor(getLabelSize), //0.05 * 2**(0.75*(i)),
            fontFamily: fontFamily,
            fontSettings: fontSettings,
            outlineWidth: 0.33,
	    outlineMaxPixels: 0.01,
	    outlineColor: [254, 254, 254, 255],
          })
      );
    }
    return result;
  }
  filterSubLayer({layer, viewport}) {
    const { minZoom, maxZoom } = this.props;
    const { numLevels } = this.state;
    
    const zoomRatio = 1.0 - ((viewport.zoom - minZoom) / (maxZoom - minZoom));
    
    if (zoomRatio < 0.0) {
        return layer.id === 'label-level-0';
    } else if (zoomRatio > 1.0) {
    	return layer.id === 'label-level-' + numLevels;
    } else {
        for (var i=0; i <= numLevels ; i++) {
            if (zoomRatio <= (i / numLevels)) {
                return layer.id === 'label-level-' + i || layer.id == 'label-level-' + (i+1);
            }
        }
    }
    return layer.id === 'label-level-' + numLevels;
  }
}

LODTextLayer.layerName = "LODTextLayer";
LODTextLayer.defaultProps = defaultProps;

export { LODTextLayer };
