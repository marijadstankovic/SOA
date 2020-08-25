import React, { Component } from 'react'
import { Map, TileLayer, Marker } from "react-leaflet";
import { Popup } from "react-popup"

type State = {
  lat: number,
  lng: number,
  zoom: number,
}

export default class SimpleExample extends Component {
  state = {
    lat: 51.505,
    lng: -0.09,
    zoom: 13,
  }

  render() {
    const position = [this.state.lat, this.state.lng]
    return (
	<div>
      <Map center={position} zoom={this.state.zoom} height="1000px" width="1000px">
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		  height="1000px" width="1000px"
        />
        <Marker position={position}>
          
        </Marker>
      </Map>
	</div>
    )
  }
}