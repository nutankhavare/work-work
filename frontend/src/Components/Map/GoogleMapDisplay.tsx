import React from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import type { LiveVehicle } from "../../Types/Index";
import { renderToStaticMarkup } from "react-dom/server";
import { BsBusFrontFill } from "react-icons/bs";
import { Users, UserCircle } from "lucide-react";

// NOTE: The icon definitions have been moved from here...

interface GoogleMapProps {
  vehicles: LiveVehicle[];
  selectedVehicleNumber: string | null;
  onVehicleSelect: (vehicle_number: string) => void;
}

const GoogleMapDisplay: React.FC<GoogleMapProps> = ({
  vehicles,
  selectedVehicleNumber,
  onVehicleSelect,
}) => {
  const createIconFromReactIcon = (color: string, size: number) => {
    const iconMarkup = renderToStaticMarkup(
      <BsBusFrontFill color={color} size={size} />
    );
    const dataUrl = `data:image/svg+xml;base64,${btoa(iconMarkup)}`;

    return {
      url: dataUrl,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  };

  const defaultIcon = React.useMemo(() => {
    if (!window.google) return undefined;
    return createIconFromReactIcon("#007BFF", 32); // Blue, 32px
  }, []);

  const selectedIcon = React.useMemo(() => {
    if (!window.google) return undefined;
    return createIconFromReactIcon("#8A2BE2", 42); // Purple, 42px
  }, []);

  const driverIcon = React.useMemo(() => {
    if (!window.google) return undefined;
    const iconMarkup = renderToStaticMarkup(<UserCircle color="#10b981" size={20} />);
    const dataUrl = `data:image/svg+xml;base64,${btoa(iconMarkup)}`;
    return {
      url: dataUrl,
      scaledSize: new window.google.maps.Size(20, 20),
      anchor: new window.google.maps.Point(10, 10),
    };
  }, []);

  const staffIcon = React.useMemo(() => {
    if (!window.google) return undefined;
    const iconMarkup = renderToStaticMarkup(<Users color="#3b82f6" size={16} />);
    const dataUrl = `data:image/svg+xml;base64,${btoa(iconMarkup)}`;
    return {
      url: dataUrl,
      scaledSize: new window.google.maps.Size(16, 16),
      anchor: new window.google.maps.Point(8, 8),
    };
  }, []);

  const mapContainerStyle = {
    height: "100%",
    width: "100%",
    minHeight: "500px",
  };
  // const centerPosition = { lat: 15.8497, lng: 74.4977 }; // Belagavi

  const centerPosition = vehicles.length > 0
    ? vehicles[0].gps
    : { lat: 15.8497, lng: 74.4977 }; // Fallback if no vehicles


  return (

    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={centerPosition}
      zoom={13}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {vehicles.map((vehicle) => (
        <React.Fragment key={vehicle.vehicle_number}>
          <MarkerF
            position={vehicle.gps}
            icon={
              vehicle.vehicle_number === selectedVehicleNumber ? selectedIcon : defaultIcon
            }
            onClick={() => {
              onVehicleSelect(vehicle.vehicle_number);
            }}
            title={`Vehicle: ${vehicle.vehicle_number} | Driver: ${
              vehicle.beacons?.find((b) => b.type === "driver")?.name || "Unassigned"
            }`}
          />
          {vehicle.beacons?.map((beacon, idx) => {
             // Calculate a slight offset based on index so they cluster around the bus
             const latOffset = (idx % 2 === 0 ? 1 : -1) * (0.00015 * Math.ceil((idx + 1) / 2));
             const lngOffset = (idx % 2 !== 0 ? 1 : -1) * (0.00015 * Math.ceil((idx + 1) / 2));
             const position = { lat: vehicle.gps.lat + latOffset, lng: vehicle.gps.lng + lngOffset };
             return (
               <MarkerF
                 key={`${vehicle.vehicle_number}-beacon-${beacon.id}`}
                 position={position}
                 icon={beacon.type === 'driver' ? driverIcon : staffIcon}
                 title={`${beacon.type.toUpperCase()}: ${beacon.name}`}
               />
             );
          })}
        </React.Fragment>
      ))}
    </GoogleMap>
  );
};

export default GoogleMapDisplay;
