// A deck.gl custom layer taken from https://observablehq.com/@pessimistress/deck-gl-custom-layer-tutorial
import * as turf from "@turf/turf";

import {CompositeLayer, TextLayer} from './deck-layers';

const defaultProps = {
  getPosition: {type: "accessor", value: p => [p.x, p.y]},
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
  fontFamily: "Monaco, monospace"
};

class LODTextLayer extends CompositeLayer {
  updateState({ changeFlags }) {
    const { data } = this.props;
    if (changeFlags.dataChanged && data) {
      const maxLevel = 6; // TODO: Calculate this is a max properly
      var levelData = []
      for (var i=0; i <= maxLevel; i++) {
        const level = data.filter(x => x.level == i)//.map((x, y, label) => { position: [x, y], label})
        //const mapped_level = level.map(( x, y, label ) => this.getSubLayerRow(( position: [x, y] ));
        levelData.push(level);
      }

      this.setState({ levelData });
    }
  }
  renderLayers() {
    const {
      getLabel,
      getLabelSize,
      getLabelColor,
      labelSizeUnits,
      labelBackground,
      billboard,
      fontFamily,
      zoomThresh,
    } = this.props;
    var result = [];
    for (var i=0; i<=6; i++) { // TODO: Should be maxLevel
      result.push(
          new TextLayer(this.getSubLayerProps({ id: "text" }), {
            data: this.state.levelData[i],
            id: "label-level-" + i,
            billboard: false,
            sizeUnits: labelSizeUnits,
            getColor: [24 * i, 24 * i, 24 * i], // TODO: Take colors at levels
            getPosition: d => [d.x, d.y],
            getText: this.getSubLayerAccessor(getLabel),
            getSize: this.getSubLayerAccessor(getLabelSize) * (i + 1)**2,
          })
      );
    }
    return result;
  }
  filterSubLayer({layer, viewport}) {
    if (viewport.zoom > this.props.zoomThresh) {
        return layer.id === 'label-level-0'
    } else {
        for (var i=6; i >= 0 ; i--) { // TODO: this should be maxLevel
            if (viewport.zoom <= this.props.zoomThresh - i) { // TODO: calculate zoom thresholds from min and max
                return layer.id === 'label-level-' + i || layer.id == 'label-level-' + (i+1);
            }
        }
    }
    return layer.id === 'label-level-6'; // TODO: this should be maxLevel
  }
}

LODTextLayer.layerName = "LODTextLayer";
LODTextLayer.defaultProps = defaultProps;

export { LODTextLayer };
