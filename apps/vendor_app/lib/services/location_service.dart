import 'package:geolocator/geolocator.dart';
import 'dart:math' as math;

class LocationService {
  static const double officeLat = 17.433749;
  static const double officeLng = 78.375504;
  static const double radiusMeters = 200.0;

  Future<bool> checkPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  Future<bool> isWithinOffice() async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        officeLat,
        officeLng,
      );

      return distanceInMeters <= radiusMeters;
    } catch (e) {
      return false;
    }
  }

  double calculateDistance(double lat, double lng) {
    return Geolocator.distanceBetween(lat, lng, officeLat, officeLng);
  }
}
