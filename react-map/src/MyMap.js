import React, {Component} from "react";
import { Map, TileLayer, Marker } from "react-leaflet";
import L from 'leaflet';

const iconPerson = new L.Icon({
    iconUrl: require('./man-user.svg'),
    iconRetinaUrl: require('./man-user.svg'),
    iconAnchor: null,
    popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    iconSize: new L.Point(60, 75),
    className: 'leaflet-div-icon'
});

export default class MyMap extends Component {
  constructor() {
    super();
    this.state = {
      markers: [[51.505, -0.09]]
    };
  }

  addMarker = (e) => {
    const {markers} = this.state
    markers.push(e.latlng)
    this.setState({markers})
  }

  render() {
    return (
	<div>
      <Map 
        center={[51.505, -0.09]} 
        onClick={this.addMarker}
        zoom={13} 
		width="100%"
		height="100%"
        >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
		  width="100%"
		  height="100%"
        />
        {this.state.markers.map((position, idx) => 
          <Marker key={`marker-${idx}`} position={position} icon={iconPerson}>
          
        </Marker>
        )}
      </Map>
	</div>
    );
  }
}