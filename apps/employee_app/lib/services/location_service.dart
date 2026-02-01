import 'package:geolocator/geolocator.dart';

class LocationService {
  static const double officeLat = 17.433749;
  static const double officeLng = 78.375504;
  static const double radiusMeters = 200.0;

  Future<bool> checkPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }

    if (permission == LocationPermission.deniedForever) return false;

    return true;
  }

  Future<bool> isWithinOffice({Map<String, dynamic>? settings}) async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final lat = settings?['office_latitude'] ?? officeLat;
      final lng = settings?['office_longitude'] ?? officeLng;
      final radius = settings?['office_radius_meters'] ?? radiusMeters;

      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        lat,
        lng,
      );

      return distanceInMeters <= radius;
    } catch (e) {
      return false;
    }
  }
}
