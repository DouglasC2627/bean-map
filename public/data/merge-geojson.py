"""
Merge individual region GeoJSON files into one regions.geojson.

Usage:
  1. Place all extracted .json files in a folder called `extracted-geojsons/`
  2. Name each file by regionId: et-yirgacheffe.json, ke-nyeri.json, etc.
  3. Run: python merge-geojson.py

When a source file contains multiple features (e.g. all districts of a
province), every feature's polygon is concatenated into a MultiPolygon so
the entire growing region is highlighted, not just one administrative unit.
"""

import json
import os

REGION_META = {
    "et-yirgacheffe": {"country": "Ethiopia", "name": "Yirgacheffe, Gedeo Zone · Ethiopia", "altitudeRange": [1750, 2200]},
    "et-sidamo": {"country": "Ethiopia", "name": "Sidamo, SNNPR · Ethiopia", "altitudeRange": [1550, 2200]},
    "et-guji": {"country": "Ethiopia", "name": "Guji Zone, Oromia · Ethiopia", "altitudeRange": [1800, 2300]},
    "ke-nyeri": {"country": "Kenya", "name": "Nyeri County · Kenya", "altitudeRange": [1200, 2000]},
    "ke-kirinyaga": {"country": "Kenya", "name": "Kirinyaga County · Kenya", "altitudeRange": [1300, 1900]},
    "rw-nyamasheke": {"country": "Rwanda", "name": "Nyamasheke, Western Province · Rwanda", "altitudeRange": [1500, 2000]},
    "tz-kilimanjaro": {"country": "Tanzania", "name": "Kilimanjaro slopes · Tanzania", "altitudeRange": [1200, 1800]},
    "bu-kayanza": {"country": "Burundi", "name": "Kayanza Province · Burundi", "altitudeRange": [1700, 2000]},
    "gt-antigua": {"country": "Guatemala", "name": "Antigua Valley, Sacatepéquez · Guatemala", "altitudeRange": [1500, 1700]},
    "gt-huehue": {"country": "Guatemala", "name": "Huehuetenango · Guatemala", "altitudeRange": [1500, 2000]},
    "cr-tarrazu": {"country": "Costa Rica", "name": "Tarrazú, San José · Costa Rica", "altitudeRange": [1200, 1900]},
    "pa-boquete": {"country": "Panama", "name": "Boquete, Chiriquí · Panama", "altitudeRange": [1200, 1800]},
    "hn-copan": {"country": "Honduras", "name": "Copán · Honduras", "altitudeRange": [1000, 1500]},
    "sv-apaneca": {"country": "El Salvador", "name": "Apaneca-Ilamatepec range · El Salvador", "altitudeRange": [1000, 1800]},
    "ni-jinotega": {"country": "Nicaragua", "name": "Jinotega · Nicaragua", "altitudeRange": [1100, 1700]},
    "mx-chiapas": {"country": "Mexico", "name": "Chiapas Highlands · Mexico", "altitudeRange": [900, 1800]},
    "co-huila": {"country": "Colombia", "name": "Huila · Colombia", "altitudeRange": [1200, 2000]},
    "co-narino": {"country": "Colombia", "name": "Nariño · Colombia", "altitudeRange": [1500, 2300]},
    "co-tolima": {"country": "Colombia", "name": "Tolima · Colombia", "altitudeRange": [1200, 2000]},
    "br-cerrado": {"country": "Brazil", "name": "Cerrado Mineiro, MG · Brazil", "altitudeRange": [800, 1300]},
    "br-sul-minas": {"country": "Brazil", "name": "Sul de Minas, MG · Brazil", "altitudeRange": [700, 1350]},
    "pe-cajamarca": {"country": "Peru", "name": "Cajamarca · Peru", "altitudeRange": [1200, 2050]},
    "bo-caranavi": {"country": "Bolivia", "name": "Caranavi, La Paz · Bolivia", "altitudeRange": [800, 1650]},
    "id-sumatra": {"country": "Indonesia", "name": "Lintong, North Sumatra · Indonesia", "altitudeRange": [1200, 1600]},
    "id-java": {"country": "Indonesia", "name": "Ijen Plateau, East Java · Indonesia", "altitudeRange": [900, 1500]},
    "ye-haraz": {"country": "Yemen", "name": "Haraz Mountains · Yemen", "altitudeRange": [1500, 2500]},
    "in-malabar": {"country": "India", "name": "Malabar Coast, Karnataka · India", "altitudeRange": [600, 1500]},
    "pg-eastern-highlands": {"country": "Papua New Guinea", "name": "Eastern Highlands (Goroka) · Papua New Guinea", "altitudeRange": [1300, 1900]},
    "us-kona": {"country": "United States", "name": "Kona, Big Island · United States", "altitudeRange": [150, 900]},
    "jm-blue-mountain": {"country": "Jamaica", "name": "Blue Mountains · Jamaica", "altitudeRange": [900, 1700]},
    "ec-loja": {"country": "Ecuador", "name": "Loja, Southern Highlands · Ecuador", "altitudeRange": [1400, 2100]},
    "ug-elgon": {"country": "Uganda", "name": "Sipi Falls, Mt. Elgon · Uganda", "altitudeRange": [1500, 2200]},
    "cd-kivu": {"country": "Democratic Republic of the Congo", "name": "South Kivu, Lake Kivu · Democratic Republic of the Congo", "altitudeRange": [1450, 2000]},
    "mw-misuku": {"country": "Malawi", "name": "Misuku Hills, Northern · Malawi", "altitudeRange": [1700, 2000]},
    "zm-northern": {"country": "Zambia", "name": "Kasama, Northern Province · Zambia", "altitudeRange": [1300, 1700]},
    "zw-highlands": {"country": "Zimbabwe", "name": "Chipinge, Eastern Highlands · Zimbabwe", "altitudeRange": [1100, 1700]},
    "vn-dalat": {"country": "Vietnam", "name": "Da Lat, Lam Dong · Vietnam", "altitudeRange": [1300, 1650]},
    "cn-yunnan": {"country": "China", "name": "Pu'er, Yunnan · China", "altitudeRange": [1100, 1700]},
    "th-doichang": {"country": "Thailand", "name": "Doi Chang, Chiang Rai · Thailand", "altitudeRange": [1200, 1700]},
    "mm-ywangan": {"country": "Myanmar", "name": "Ywangan, Shan State · Myanmar", "altitudeRange": [1100, 1600]},
    "tl-ermera": {"country": "Timor-Leste", "name": "Ermera, Western Highlands · Timor-Leste", "altitudeRange": [1300, 1700]},
    "ph-benguet": {"country": "Philippines", "name": "Benguet, Cordillera · Philippines", "altitudeRange": [1200, 1800]},
    "do-barahona": {"country": "Dominican Republic", "name": "Barahona, Southwest · Dominican Republic", "altitudeRange": [600, 1300]},
    "cu-sierra-maestra": {"country": "Cuba", "name": "Sierra Maestra, Eastern · Cuba", "altitudeRange": [900, 1400]},
    "ve-tachira": {"country": "Venezuela", "name": "Tachira, Western Andes · Venezuela", "altitudeRange": [1000, 1500]},
    "ht-thiotte": {"country": "Haiti", "name": "Thiotte, Belle-Anse · Haiti", "altitudeRange": [900, 1400]},
    "pr-yauco": {"country": "Puerto Rico", "name": "Yauco, Southwest · Puerto Rico", "altitudeRange": [750, 1100]},
    "la-bolaven": {"country": "Laos", "name": "Bolaven Plateau, Champasak · Laos", "altitudeRange": [1000, 1350]},
    "np-himalaya": {"country": "Nepal", "name": "Gulmi, Western Hills · Nepal", "altitudeRange": [1200, 1800]},
    "et-limu": {"country": "Ethiopia", "name": "Limu, Jimma Zone · Ethiopia", "altitudeRange": [1400, 2000]},
    "et-harrar": {"country": "Ethiopia", "name": "Harrar, Eastern Highlands · Ethiopia", "altitudeRange": [1500, 2100]},
    "co-cauca": {"country": "Colombia", "name": "Cauca, Southern · Colombia", "altitudeRange": [1700, 2100]},
    "gt-atitlan": {"country": "Guatemala", "name": "Atitlan, Lake Highlands · Guatemala", "altitudeRange": [1500, 2000]},
    "br-mogiana": {"country": "Brazil", "name": "Mogiana, Sao Paulo · Brazil", "altitudeRange": [900, 1200]},
    "ke-embu": {"country": "Kenya", "name": "Embu, Central Kenya · Kenya", "altitudeRange": [1400, 1800]},
}


def point_in_ring(x, y, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def point_in_polygon(point, polygon_rings):
    """polygon_rings is [outer_ring, hole1, hole2, ...]."""
    if not polygon_rings:
        return False
    if not point_in_ring(point[0], point[1], polygon_rings[0]):
        return False
    for hole in polygon_rings[1:]:
        if point_in_ring(point[0], point[1], hole):
            return False
    return True


def feature_polygons(geom):
    """Yield each Polygon (list of rings) inside any geometry."""
    if geom is None:
        return
    t = geom.get("type")
    if t == "Polygon":
        yield geom["coordinates"]
    elif t == "MultiPolygon":
        for p in geom["coordinates"]:
            yield p
    elif t == "GeometryCollection":
        for g in geom.get("geometries", []):
            yield from feature_polygons(g)


def feature_contains_point(feature, point):
    geom = feature.get("geometry") or feature
    return any(point_in_polygon(point, poly) for poly in feature_polygons(geom))


def union_features_to_multipolygon(features):
    """Concatenate every Polygon/MultiPolygon ring set into one MultiPolygon."""
    polys = []
    for f in features:
        geom = f.get("geometry") or f
        polys.extend(list(feature_polygons(geom)))
    return {"type": "MultiPolygon", "coordinates": polys}


def load_bean_coords(beans_path):
    if not os.path.exists(beans_path):
        return {}
    beans = json.load(open(beans_path))
    return {b["id"]: b["coordinates"] for b in beans}


def select_geometry(data):
    """
    Pick the best geometry from a source file.
    - FeatureCollection with multiple features: union all into a MultiPolygon.
    - FeatureCollection with one feature: take its geometry.
    - Feature: take its geometry.
    - Otherwise: assume the file *is* a geometry.
    """
    if data.get("type") == "FeatureCollection":
        feats = data.get("features", [])
        if not feats:
            return None
        if len(feats) == 1:
            return feats[0].get("geometry")
        return union_features_to_multipolygon(feats)
    if data.get("type") == "Feature":
        return data.get("geometry")
    return data


def merge_regions(input_dir, output_file, bean_coords):
    features = []
    missing = []
    coords_outside = []

    for region_id, meta in REGION_META.items():
        filepath = os.path.join(input_dir, f"{region_id}.json")
        if not os.path.exists(filepath):
            missing.append(region_id)
            continue

        with open(filepath) as f:
            data = json.load(f)

        geom = select_geometry(data)
        if geom is None:
            missing.append(region_id)
            continue

        # Sanity-check: warn if the bean's coord falls outside the merged geometry
        bean_coord = bean_coords.get(region_id)
        if bean_coord is not None:
            polys = list(feature_polygons(geom))
            if not any(point_in_polygon(bean_coord, p) for p in polys):
                coords_outside.append(region_id)

        features.append({
            "type": "Feature",
            "properties": {
                "regionId": region_id,
                "country": meta["country"],
                "name": meta["name"],
                "altitudeRange": meta["altitudeRange"],
            },
            "geometry": geom,
        })

    if missing:
        print(f"⚠  Missing files for: {', '.join(missing)}")
    if coords_outside:
        print(f"⚠  Bean coord falls OUTSIDE highlighted polygon for: {', '.join(coords_outside)}")
        print(f"   Either nudge the bean coord in src/data/beans.json or extract additional districts.")

    result = {"type": "FeatureCollection", "features": features}

    with open(output_file, "w") as f:
        json.dump(result, f)

    size_kb = os.path.getsize(output_file) / 1024
    print(f"✅ Wrote {output_file}: {len(features)} features, {size_kb:.0f} KB")
    if size_kb > 500:
        print(f"⚠  File is {size_kb:.0f} KB — target is <500 KB. Re-simplify the largest polygons.")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(script_dir, "extracted-geojsons")
    output_file = os.path.join(script_dir, "regions.geojson")
    beans_path = os.path.normpath(
        os.path.join(script_dir, "..", "..", "src", "data", "beans.json")
    )
    merge_regions(input_dir, output_file, load_bean_coords(beans_path))
