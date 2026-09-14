#!/usr/bin/env python3
"""Generate Phaser-friendly collision and object metadata from Beginning Fields.tmx.
Uses only the Python standard library.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import xml.etree.ElementTree as ET

FLIP_MASK = 0xE0000000


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tmx', type=Path, default=Path('public/assets/fantasy/Tiled/Tilemaps/Beginning Fields.tmx'))
    parser.add_argument('--out', type=Path, default=Path('public/data'))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    tmx = args.tmx.resolve()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    base = tmx.parent
    root = ET.parse(tmx).getroot()

    tilesets = []
    for node in root.findall('tileset'):
        first_gid = int(node.get('firstgid', '0'))
        source = (base / node.get('source', '')).resolve()
        tilesets.append((first_gid, source, ET.parse(source).getroot()))
    tilesets.sort(key=lambda item: item[0])

    def resolve_gid(raw_gid: int):
        gid = raw_gid & ~FLIP_MASK
        for first_gid, source, tileset in reversed(tilesets):
            if gid >= first_gid:
                return gid - first_gid, source, tileset
        raise KeyError(f'Unable to resolve GID {gid}')

    def object_bbox(obj):
        x = float(obj.get('x', '0')); y = float(obj.get('y', '0'))
        polygon = obj.find('polygon')
        if polygon is not None:
            points = []
            for pair in polygon.get('points', '').split():
                px, py = map(float, pair.split(','))
                points.append((x + px, y + py))
            xs = [p[0] for p in points]; ys = [p[1] for p in points]
            return min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
        width = float(obj.get('width', '0')); height = float(obj.get('height', '0'))
        if width > 0 and height > 0:
            return x, y, width, height
        return None

    def tile_colliders(tile_id: int, tileset):
        tile = tileset.find(f"tile[@id='{tile_id}']")
        if tile is None:
            return []
        group = tile.find('objectgroup')
        if group is None:
            return []
        result = []
        for obj in group.findall('object'):
            box = object_bbox(obj)
            if box and box[2] > 0.2 and box[3] > 0.2:
                result.append(box)
        return result

    collisions = []

    def visit_layers(parent):
        for child in parent:
            if child.tag == 'layer' and child.get('visible', '1') != '0':
                width = int(child.get('width', root.get('width', '40')))
                data = child.find('data')
                if data is None or data.get('encoding') != 'csv':
                    continue
                values = [int(v.strip()) for v in (data.text or '').replace('\n', '').split(',') if v.strip()]
                for index, gid in enumerate(values):
                    if not gid:
                        continue
                    tile_id, _, tileset = resolve_gid(gid)
                    for bx, by, bw, bh in tile_colliders(tile_id, tileset):
                        collisions.append({
                            'x': (index % width) * 16 + bx,
                            'y': (index // width) * 16 + by,
                            'w': bw, 'h': bh, 'source': child.get('name', 'layer')
                        })
            elif child.tag == 'group':
                visit_layers(child)

    visit_layers(root)
    world_objects = []
    pack_root = (base / '../..').resolve()

    for group in root.findall('.//objectgroup'):
        if group.get('visible', '1') == '0':
            continue
        for obj in group.findall('object'):
            raw_gid = obj.get('gid')
            if raw_gid is None:
                continue
            tile_id, source, tileset = resolve_gid(int(raw_gid))
            tile = tileset.find(f"tile[@id='{tile_id}']")
            image = tile.find('image') if tile is not None else None
            if image is not None:
                image_width = float(image.get('width', tileset.get('tilewidth', '16')))
                image_height = float(image.get('height', tileset.get('tileheight', '16')))
            else:
                image_width = float(tileset.get('tilewidth', '16'))
                image_height = float(tileset.get('tileheight', '16'))

            object_width = float(obj.get('width', image_width)); object_height = float(obj.get('height', image_height))
            scale_x = object_width / image_width if image_width else 1
            scale_y = object_height / image_height if image_height else 1
            object_x = float(obj.get('x', '0')); object_bottom = float(obj.get('y', '0')); object_top = object_bottom - object_height

            for bx, by, bw, bh in tile_colliders(tile_id, tileset):
                collisions.append({
                    'x': object_x + bx * scale_x, 'y': object_top + by * scale_y,
                    'w': bw * scale_x, 'h': bh * scale_y, 'source': group.get('name', 'objects')
                })

            if image is not None:
                source_image = (source.parent / image.get('source', '')).resolve()
                asset_path = os.path.relpath(source_image, pack_root).replace(os.sep, '/')
                world_objects.append({
                    'id': int(obj.get('id', '0')), 'gid': int(raw_gid) & ~FLIP_MASK,
                    'x': round(object_x, 3), 'y': round(object_top, 3),
                    'width': round(object_width, 3), 'height': round(object_height, 3),
                    'bottom': round(object_bottom, 3), 'asset': asset_path,
                    'kind': tileset.get('name', 'object')
                })
            elif tileset.get('name') == 'Campfire':
                world_objects.append({
                    'id': int(obj.get('id', '0')), 'gid': int(raw_gid) & ~FLIP_MASK,
                    'x': round(object_x, 3), 'y': round(object_top, 3),
                    'width': round(object_width, 3), 'height': round(object_height, 3),
                    'bottom': round(object_bottom, 3),
                    'asset': 'Art/Props/Animation/Animation_Campfire.png', 'kind': 'Campfire', 'frame': tile_id
                })

    filtered = []
    for rect in collisions:
        x = max(0, rect['x']); y = max(0, rect['y'])
        x2 = min(640, rect['x'] + rect['w']); y2 = min(640, rect['y'] + rect['h'])
        if x2 > x and y2 > y:
            filtered.append({
                'x': round(x, 2), 'y': round(y, 2), 'w': round(x2 - x, 2), 'h': round(y2 - y, 2), 'source': rect['source']
            })

    (out / 'beginning-fields-collisions.json').write_text(json.dumps(filtered, indent=2), encoding='utf-8')
    (out / 'beginning-fields-objects.json').write_text(json.dumps(world_objects, indent=2), encoding='utf-8')
    print(f'Generated {len(filtered)} collision rectangles and {len(world_objects)} world objects.')


if __name__ == '__main__':
    main()
