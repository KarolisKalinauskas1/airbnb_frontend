<template>
  <div ref="mapContainer" class="w-full h-full"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Circle, Fill, Stroke } from 'ol/style'

const props = defineProps({
  latitude: {
    type: [Number, String],
    required: true
  },
  longitude: {
    type: [Number, String],
    required: true
  },
  spotTitle: {
    type: String,
    default: ''
  }
})

const mapContainer = ref(null)
const map = ref(null)
const vectorLayer = ref(null)

const initializeMap = () => {
  if (map.value) return

  // Create vector source and layer for marker
  const vectorSource = new VectorSource()
  vectorLayer.value = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: '#ef4444' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      })
    })
  })

  // Initialize map
  map.value = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({ source: new OSM() }),
      vectorLayer.value
    ],
    view: new View({
      center: fromLonLat([parseFloat(props.longitude), parseFloat(props.latitude)]),
      zoom: 13
    })
  })

  // Add marker
  addMarker()
}

const addMarker = () => {
  if (!vectorLayer.value) return

  const coords = [parseFloat(props.longitude), parseFloat(props.latitude)]
  const markerFeature = new Feature({
    geometry: new Point(fromLonLat(coords))
  })

  vectorLayer.value.getSource().clear()
  vectorLayer.value.getSource().addFeature(markerFeature)
}

// Update marker when coordinates change
watch([() => props.latitude, () => props.longitude], () => {
  if (map.value) {
    const coords = [parseFloat(props.longitude), parseFloat(props.latitude)]
    map.value.getView().animate({
      center: fromLonLat(coords),
      duration: 500
    })
    addMarker()
  }
})

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.setTarget(undefined)
  }
})
</script>

<style>
.ol-control {
  display: none;
}
</style>
