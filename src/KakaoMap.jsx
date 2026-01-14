import { useEffect, useRef } from "react";

export default function KakaoMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    // window.kakao가 아직 없으면 종료
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const container = mapRef.current;
      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, options);

      // 예시: 마커 하나 찍기
      new window.kakao.maps.Marker({
        position: options.center,
        map,
      });
    });
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "500px", height: "500px", borderRadius: "12px" }}
    />
  );
}
