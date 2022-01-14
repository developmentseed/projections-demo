import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import mapboxgl from '../../mb-gl/mapbox-gl';
import '../../mb-gl/mapbox-gl.css';
import CompareMbGL from 'mapbox-gl-compare';
import 'mapbox-gl-compare/dist/mapbox-gl-compare.css';

import App from '../common/app';
import { PageMainContent } from '../../styles/page';
import { glsp, themeVal } from '@devseed-ui/theme-provider';
import { Form, FormCheckable, FormLabel, FormSelect } from '@devseed-ui/form';

import mbAoiDraw from '../common/draw/mb-aoi-draw';
import { Button } from '@devseed-ui/button';
import { Heading } from '@devseed-ui/typography';
import { CollecticonArea, CollecticonTrashBin } from '@devseed-ui/collecticons';
import { useEffectPrevious } from '../../utils/use-effect-previous';

mapboxgl.accessToken =
  'pk.eyJ1IjoiY292aWQtbmFzYSIsImEiOiJja2F6eHBobTUwMzVzMzFueGJuczF6ZzdhIn0.8va1fkyaWgM57_gZ2rBMMg';

const PageMain = styled(PageMainContent)`
  position: relative;
  display: flex;
`;

const MapsContainer = styled.div`
  position: relative;
  overflow: hidden;
  flex-grow: 1;
`;

const SingleMapContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const OptForm = styled(Form)`
  grid-gap: 0;
`;

const ProjectionList = styled.div`
  position: absolute;
  top: ${glsp()};
  right: ${glsp()};
  padding: ${glsp()};
  background-color: ${themeVal('color.surface')};
  box-shadow: ${themeVal('boxShadow.elevationC')};
  border-radius: ${themeVal('shape.rounded')};
`;

const ProjFieldValue = styled.small`
  color: ${themeVal('color.base-400')};
  font-weight: ${themeVal('type.base.weight')};
  margin-left: auto;
`;

const projections = [
  { id: 'globe', label: 'Globe' },
  { id: 'albers', label: 'Albers' },
  { id: 'equalEarth', label: 'Equal Earth' },
  { id: 'equirectangular', label: 'Equirectangular' },
  { id: 'lambertConformalConic', label: 'Lambert Conformal Conic' },
  { id: 'mercator', label: 'Mercator' },
  { id: 'naturalEarth', label: 'Natural Earth' },
  { id: 'winkelTripel', label: 'Winkel Tripel' }
];

const layers = [
  {
    id: 'no2',
    label: 'Nitrogen Dioxide',
    url: 'https://8ib71h0627.execute-api.us-east-1.amazonaws.com/v1/{z}/{x}/{y}@1x?url=s3://covid-eo-data/OMNO2d_HRM/OMI_trno2_0.10x0.10_202110_Col3_V4.nc.tif&resampling_method=bilinear&bidx=1&rescale=0%2C1.5e16&color_map=custom_no2&color_formula=gamma r 0.8'
  },
  {
    id: 'co2',
    label: 'Carbon Dioxide',
    url: 'https://8ib71h0627.execute-api.us-east-1.amazonaws.com/v1/{z}/{x}/{y}@1x?url=s3://covid-eo-data/xco2-mean/xco2_16day_mean.2021_06_15.tif&resampling_method=bilinear&bidx=1&rescale=0.000408%2C0.000419&color_map=rdylbu_r&color_formula=gamma r 1.05'
  }
];

const projFields = [
  { id: 'lng', label: 'Center Longitude', min: -180, max: 180 },
  { id: 'lat', label: 'Center Latitude', min: -90, max: 90 },
  { id: 'sParLat', label: 'Southern Parallel Lat', min: -89, max: 90 },
  { id: 'nParLat', label: 'Northern Parallel Lat', min: -89, max: 90 }
];

function Home() {
  const theme = useTheme();
  const mapContainer = useRef();
  const mapRef = useRef();

  const mapCompareContainer = useRef();
  const mapCompareRef = useRef();
  const [comparing, setComparing] = useState();
  const compareControl = useRef();

  const [projection, setProjection] = useState('mercator');
  const [layer, setLayer] = useState('co2');
  const [projectionSettings, setProjectionSettings] = useState({
    lng: 0,
    lat: 30,
    sParLat: 30,
    nParLat: 30
  });

  const mbDrawRef = useRef(null);
  window.mbMap = mbDrawRef.current;

  const [aoiState, setAoiState] = useState({
    drawing: false,
    selected: false,
    feature: null,
    actionOrigin: null
  });

  const aoiStateAction = useCallback((action, payload) => {
    switch (action) {
      case 'aoi.draw-finish':
        setAoiState((aoi) => ({
          ...aoi,
          drawing: false,
          feature: payload.feature,
          actionOrigin: 'map'
        }));
        break;
      case 'aoi.selection':
        setAoiState((aoi) => ({
          ...aoi,
          selected: payload.selected,
          actionOrigin: payload.selected ? 'map' : null
        }));
        break;
      case 'aoi.update':
        setAoiState((aoi) => ({
          ...aoi,
          feature: payload.feature,
          actionOrigin: 'map'
        }));
        break;
    }
  }, []);

  const aoiButtonsActions = useCallback((action) => {
    switch (action) {
      case 'aoi.draw-click':
        // There can only be one selection (feature) on the map
        // If there's a feature toggle the selection.
        // If there's no feature toggle the drawing.
        setAoiState((aoi) => {
          const selected = !!aoi.feature && !aoi.selected;
          return {
            ...aoi,
            drawing: !aoi.feature && !aoi.drawing,
            selected,
            actionOrigin: selected ? 'panel' : null
          };
        });
        break;
      case 'aoi.clear':
        setAoiState({
          drawing: false,
          selected: false,
          feature: null,
          actionOrigin: null
        });
        break;
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    layers.forEach((l) => {
      mapRef.current.setLayoutProperty(
        l.id,
        'visibility',
        l.id === layer ? 'visible' : 'none'
      );
    });
  }, [layer]);

  useEffect(() => {
    if (!mapRef.current) return;

    const pSettings = {
      name: projection,
      center: [projectionSettings.lng, projectionSettings.lat],
      parallels: [projectionSettings.sParLat, projectionSettings.nParLat]
    };

    mapRef.current.setProjection(pSettings);

    if (mapCompareRef.current) {
      mapCompareRef.current.setProjection(pSettings);
    }
  }, [projectionSettings, projection]);

  useEffect(() => {
    const mbMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/covid-nasa/ckb01h6f10bn81iqg98ne0i2y',
      logoPosition: 'bottom-left',
      pitchWithRotate: false,
      dragRotate: false,
      zoom: 3
    });

    mapRef.current = mbMap;

    // Add zoom controls.
    mbMap.addControl(new mapboxgl.NavigationControl(), 'top-left');
    // Remove compass.
    document.querySelector('.mapboxgl-ctrl .mapboxgl-ctrl-compass').remove();

    mbMap.on('load', function () {
      // mbMap.addSource('island', {
      //   type: 'geojson',
      //   data: {
      //     type: 'Feature',
      //     geometry: {
      //       type: 'Point',
      //       coordinates: [0, 0]
      //     }
      //   }
      // });
      // mbMap.addLayer({
      //   id: 'island',
      //   type: 'circle',
      //   source: 'island',
      //   layout: {},
      //   paint: {
      //     'circle-radius': 8,
      //     'circle-stroke-width': 2,
      //     'circle-color': 'red',
      //     'circle-stroke-color': 'white'
      //   }
      // });

      // new mapboxgl.Marker({ color: 'red', rotation: 45 })
      //   .setLngLat([12, 55])
      //   .addTo(mbMap);

      layers.forEach((l) => {
        mbMap.addSource(l.id, {
          type: 'raster',
          tiles: [l.url]
        });
        mbMap.addLayer(
          {
            id: l.id,
            type: 'raster',
            source: l.id,
            paint: {
              'raster-opacity': 0.9
            },
            layout: {
              visibility: l.id === 'co2' ? 'visible' : 'none'
            }
          },
          'admin-0-boundary-bg'
        );
      });
    });

    return () => mbMap.remove();
  }, []);

  useEffect(() => {
    mbDrawRef.current = mbAoiDraw(mapRef.current);
    mbDrawRef.current.setup(aoiStateAction, null, theme);
  }, [aoiStateAction, theme]);

  useEffectPrevious(
    ([prevAoiState] = []) => {
      prevAoiState && mbDrawRef.current.update(prevAoiState, aoiState);
    },
    [aoiState]
  );

  useEffect(() => {
    if (comparing) {
      const mbCompareMap = new mapboxgl.Map({
        container: mapCompareContainer.current,
        style: 'mapbox://styles/covid-nasa/ckb01h6f10bn81iqg98ne0i2y',
        logoPosition: 'bottom-left',
        pitchWithRotate: false,
        dragRotate: false,
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom()
      });

      mapCompareRef.current = mbCompareMap;

      // Add zoom controls.
      mbCompareMap.addControl(new mapboxgl.NavigationControl(), 'top-left');
      // Remove compass.
      document.querySelector('.mapboxgl-ctrl .mapboxgl-ctrl-compass').remove();

      compareControl.current = new CompareMbGL(
        mbCompareMap,
        mapRef.current,
        '#container'
      );
    } else if (compareControl.current) {
      compareControl.current.remove();
      compareControl.current = null;
      mapCompareRef.current.remove();
      mapCompareRef.current = null;
    }
  }, [comparing]);

  return (
    <App pageTitle='Welcome'>
      <PageMain>
        <MapsContainer id='container'>
          <SingleMapContainer ref={mapCompareContainer} />
          <SingleMapContainer ref={mapContainer} />
        </MapsContainer>
        <ProjectionList>
          <div>
            <Heading size='xsmall' as='p'>
              AOI
            </Heading>
            <Button
              onClick={() => aoiButtonsActions('aoi.draw-click')}
              fitting='skinny'
              active={aoiState.selected || aoiState.drawing}
            >
              <CollecticonArea />
            </Button>
            <Button
              onClick={() => aoiButtonsActions('aoi.clear')}
              fitting='skinny'
              disabled={!aoiState.feature}
            >
              <CollecticonTrashBin />
            </Button>
          </div>
          <OptForm>
            <Heading size='xsmall' as='p'>
              Comparison
            </Heading>

            <FormCheckable
              id='compare'
              type='checkbox'
              value='compare'
              name='compare'
              checked={comparing}
              onChange={() => setComparing((v) => !v)}
            >
              Enable compare
            </FormCheckable>

            <FormLabel>Layers</FormLabel>
            {layers.map((l) => (
              <FormCheckable
                key={l.id}
                id={l.id}
                type='radio'
                value={l.id}
                name='layer'
                checked={layer === l.id}
                onChange={() => setLayer(l.id)}
              >
                {l.label}
              </FormCheckable>
            ))}

            <FormLabel>Projections</FormLabel>
            <FormSelect
              value={projection}
              onChange={(e) => setProjection(e.target.value)}
            >
              {projections.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </FormSelect>

            {['albers', 'lambertConformalConic'].includes(projection) &&
              projFields.map((f) => {
                const onChange = (e) =>
                  setProjectionSettings((v) => ({
                    ...v,
                    [f.id]: Number(e.target.value)
                  }));

                return (
                  <React.Fragment key={f.id}>
                    <FormLabel>
                      {f.label}{' '}
                      <ProjFieldValue>
                        {projectionSettings[f.id]}
                      </ProjFieldValue>
                    </FormLabel>
                    <input
                      type='range'
                      min={f.min}
                      max={f.max}
                      name={f.id}
                      value={projectionSettings[f.id]}
                      onChange={onChange}
                    />
                  </React.Fragment>
                );
              })}
          </OptForm>
        </ProjectionList>
      </PageMain>
    </App>
  );
}

export default Home;
