import {
  Vector2,
  Vector3,
  Mesh,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  type Object3DEventMap,
  Line3,
  Matrix4,
  BufferGeometry,
  BufferAttribute,
} from "three";
import { MeshBVH } from "three-mesh-bvh";
import { useThree } from "@react-three/fiber";
import earcut from "../utils/earcut";
import type { UseThree } from "../shared-variables";

// 空间哈希数据结构
class SpatialHash {
  private grid: Map<string, number[]>;
  private cellSize: number;

  constructor(cellSize: number) {
    this.grid = new Map();
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return `${gridX},${gridY}`;
  }

  insert(pointIndex: number, x: number, y: number): void {
    const key = this.getKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(pointIndex);
  }

  getNeighbors(x: number, y: number): number[] {
    const results: number[] = [];
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cell = this.grid.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }

    return results;
  }
}

const vector3ToVector2 = (points: Vector3[], normal: Vector3) => {
  const dotProduct = (v1: Vector3, v2: Vector3) =>
    v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  const subtract = (v1: Vector3, v2: Vector3) =>
    new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);

  const scale = (v: Vector3, s: number) =>
    new Vector3(v.x * s, v.y * s, v.z * s);

  const projectPointOntoPlane = (
    point: Vector3,
    planeNormal: Vector3,
    planePoint: Vector3
  ) => {
    const v = subtract(point, planePoint);
    const d = dotProduct(v, planeNormal);
    const projected = subtract(point, scale(planeNormal, d));
    return new Vector3(point.x, point.y, projected.z);
  };

  const v2dList = points.map((point) => {
    const v = projectPointOntoPlane(point, normal, points[0]);
    return new Vector2(v.x, v.y);
  });

  return v2dList;
};

const triangulation = (points: Vector2[]) => {
  const vertices: number[] = [];
  points.forEach((point) => {
    vertices.push(point.x, point.y);
  });
  const triangles = earcut(vertices);
  const triangleList: Vector2[][] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    triangleList.push([
      points[triangles[i]],
      points[triangles[i + 1]],
      points[triangles[i + 2]],
    ]);
  }
  return triangleList;
};

// 将一组线段连接成多边形
export const getAllPolygons = (
  points: Vector2[],
  tolerance: number = 0.000001
) => {
  if (points.length < 2) return [];

  // 构建图
  const graph = new Map<number, number[]>();

  // 使用空间哈希进行高效的邻近点查找和去重
  const uniquePoints: Vector2[] = [];
  const pointIndexMap = new Map<string, number>();
  const spatialHash = new SpatialHash(tolerance);

  const getKey = (point: Vector2) => {
    const roundToTolerance = (value: number) =>
      Math.round(value / tolerance) * tolerance;
    return `${roundToTolerance(point.x)},${roundToTolerance(point.y)}`;
  };

  // 修改优化版的去重部分
  const pointAccumulators = new Map<
    string,
    { sumX: number; sumY: number; count: number }
  >();

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const key = getKey(point);

    if (!pointAccumulators.has(key)) {
      pointAccumulators.set(key, { sumX: 0, sumY: 0, count: 0 });
    }

    const acc = pointAccumulators.get(key)!;
    acc.sumX += point.x;
    acc.sumY += point.y;
    acc.count++;
  }

  // 构建 uniquePoints 和 pointIndexMap
  pointAccumulators.forEach((acc, key) => {
    const avgX = acc.sumX / acc.count;
    const avgY = acc.sumY / acc.count;
    const avgPoint = new Vector2(avgX, avgY); // 创建新的 Vector2
    const newIndex = uniquePoints.length;
    uniquePoints.push(avgPoint);
    pointIndexMap.set(key, newIndex);
    spatialHash.insert(newIndex, avgX, avgY);
  });

  // 根据去重后的点构建邻接列表
  for (let i = 0; i < points.length; i += 2) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const key1 = getKey(p1);
    const key2 = getKey(p2);
    const index1 = pointIndexMap.get(key1)!;
    const index2 = pointIndexMap.get(key2)!;

    if (!graph.has(index1)) graph.set(index1, []);
    if (!graph.has(index2)) graph.set(index2, []);
    graph.get(index1)!.push(index2);
    graph.get(index2)!.push(index1);
  }

  // 寻找环
  const visited = new Set<number>();
  const cycles: number[][] = [];
  const stack: { node: number; parent: number | null }[] = [];

  const findCycles = (node: number, parent: number | null) => {
    visited.add(node);
    stack.push({ node, parent });

    for (const neighbor of graph.get(node) || []) {
      if (neighbor === parent) continue;

      if (visited.has(neighbor)) {
        const cycleStartIndex = stack.findIndex(
          (item) => item.node === neighbor
        );
        if (cycleStartIndex !== -1) {
          const cycle = stack.slice(cycleStartIndex).map((item) => item.node);
          cycles.push(cycle);
        }
      } else {
        findCycles(neighbor, node);
      }
    }
    stack.pop();
  };

  // 遍历所有节点以找到所有独立的环
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      findCycles(node, null);
    }
  }

  // 将环的索引转换为多边形点集
  const uniqueCycles = new Set<string>();
  const allPolygons: Vector2[][] = [];

  for (const cycle of cycles) {
    // 确保环是唯一的，避免重复的多边形
    const sortedCycle = [...cycle].sort((a, b) => a - b).join(",");
    if (!uniqueCycles.has(sortedCycle)) {
      uniqueCycles.add(sortedCycle);
      const polygonPoints = cycle.map((index) => uniquePoints[index]);
      // 检查多边形是否有效（至少3个点）
      if (polygonPoints.length >= 3) {
        allPolygons.push(polygonPoints);
      }
    }
  }

  return allPolygons;
};

type ClipFilter = (item: Object3D<Object3DEventMap>) => boolean;

const useClip = () => {
  const { scene }: UseThree = useThree();

  const clip = (
    planeMesh: Mesh,
    filter: ClipFilter,
    tolerance: number = 0.000001
  ) => {
    const m = new LineBasicMaterial({ color: 0xffff00 });
    const lines: LineSegments[][] = [];
    const normal = new Vector3();
    planeMesh.getWorldDirection(normal);
    const planeBoundsTree = new MeshBVH(planeMesh.geometry);
    planeMesh.geometry.boundsTree = planeBoundsTree;
    const meshList: Mesh[] = [];

    scene.traverse((item) => {
      if (filter(item)) {
        const edge = new Line3();
        const itemSegments: Vector3[] = [];
        const itemLines: LineSegments[] = [];
        planeBoundsTree.bvhcast(
          (item as Mesh).geometry.boundsTree!,
          new Matrix4()
            .copy(planeMesh.matrixWorld)
            .invert()
            .multiply(item.matrixWorld),
          {
            intersectsTriangles(tri1, tri2) {
              if (tri1.intersectsTriangle(tri2, edge)) {
                const { start, end } = edge;
                itemSegments.push(start.clone(), end.clone());
                const g = new BufferGeometry();
                g.setAttribute(
                  "position",
                  new BufferAttribute(
                    new Float32Array([
                      start.x,
                      start.y,
                      start.z,
                      end.x,
                      end.y,
                      end.z,
                    ]),
                    3
                  )
                );
                const line = new LineSegments(g, m);
                line.applyMatrix4(planeMesh.matrixWorld);
                line.renderOrder = 20;
                itemLines.push(line);
              }
              return false;
            },
          }
        );
        lines.push(itemLines);
        const vector2List = vector3ToVector2(itemSegments, normal);
        const polygons = getAllPolygons(vector2List, tolerance);
        polygons.forEach((polygon) => {
          const triangleList = triangulation(polygon).filter(
            (v) => v.length > 2
          );
          triangleList.forEach((triangle) => {
            const vector3List = triangle.map((p) => new Vector3(p.x, p.y, 0));
            const g = new BufferGeometry();
            g.setFromPoints(vector3List);
            g.computeBoundingBox();
            const mesh = new Mesh(g, (item as Mesh).material);
            mesh.userData.isClipResult = true;
            mesh.applyMatrix4(planeMesh.matrixWorld);
            mesh.renderOrder = 20;
            meshList.push(mesh);
          });
        });
      }
    });

    return { lines, meshList };
  };

  return { clip };
};

export default useClip;
