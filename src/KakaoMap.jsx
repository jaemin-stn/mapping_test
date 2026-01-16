import {useEffect, useRef} from "react";

export default function KakaoMap() {
  const mapRef = useRef(null);
  const polygonsRef = useRef([]);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("kakao sdk가 아직 로드 안 됨");
      return;
    }

    window.kakao.maps.load(async () => {
      const container = mapRef.current;
      if (!container) return;

      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        level: 9,
      });

      // ✅ 1) geojson 로드 확인
      const res = await fetch("/seoul.geojson");
      console.log("geojson status:", res.status);
      const geojson = await res.json();
      console.log("features:", geojson?.features?.length);

      // ✅ 2) 폴리곤 생성 (MultiPolygon 지원)
      geojson.features.forEach((feature) => {
        const geom = feature.geometry;
        if (!geom) return;

        const name =
          feature.properties?.adm_nm ?? feature.properties?.sggnm ?? "unknown";

        const pathsList = geometryToKakaoPaths(geom);
        if (pathsList.length === 0) return;

        pathsList.forEach((path) => {
          const polygon = new window.kakao.maps.Polygon({
            map,
            path,
            strokeWeight: 4,
            strokeColor: "#333",
            strokeOpacity: 0.0,
            fillColor: "#4aa3ff",
            fillOpacity: 0.01,
          });

          window.kakao.maps.event.addListener(polygon, "mouseover", () => {
            polygon.setOptions({
              strokeOpacity: 0.7,
              fillOpacity: 0.18, // 은은하게
            });
          });

          window.kakao.maps.event.addListener(polygon, "mouseout", () => {
            polygon.setOptions({
              strokeOpacity: 0.0,
              fillOpacity: 0.0,
            });
          });

          // 클릭 확인
          window.kakao.maps.event.addListener(polygon, "click", () => {
            console.log("클릭:", name);
          });

          polygonsRef.current.push(polygon);
        });
      });
    });

    return () => {
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current = [];
    };
  }, []);

  return (
    <div ref={mapRef} style={{width: 500, height: 500, borderRadius: 12}} />
  );
}

// ✅ 니 데이터(MultiPolygon) 구조에 맞게 path 뽑는 함수
function geometryToKakaoPaths(geometry) {
  const {type, coordinates} = geometry;

  // GeoJSON: [lng, lat]  -> Kakao: LatLng(lat, lng)
  const ringToPath = (ring) =>
    ring.map(([lng, lat]) => new window.kakao.maps.LatLng(lat, lng));

  if (type === "Polygon") {
    const outer = coordinates?.[0];
    if (!outer) return [];
    return [ringToPath(outer)];
  }

  if (type === "MultiPolygon") {
    // MultiPolygon: [ [ [ring1], [hole...] ], [ [ring1], ... ], ... ]
    return (coordinates || [])
      .map((poly) => poly?.[0]) // ✅ 외곽 ring만
      .filter(Boolean)
      .map((outerRing) => ringToPath(outerRing));
  }

  console.warn("지원 안 하는 geometry type:", type);
  return [];
}
