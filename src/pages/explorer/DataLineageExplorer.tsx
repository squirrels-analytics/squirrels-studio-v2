import { useState, useMemo, type FC } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  Position,
  MarkerType,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';

import LineageNodeComponent, { type LineageNode } from './lineage/LineageNode';
import { LineageDetailsDialog } from './lineage/LineageDetailsDialog';
import type { DataCatalogResponse } from '@/types/data-catalog-response';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { SelectionValue } from '@/lib/squirrels-api';

interface DataLineageExplorerProps {
  catalog: DataCatalogResponse;
  projectMetadata: ProjectMetadataResponse;
  paramOverrides: Record<string, SelectionValue>;
}

const nodeTypes = {
  lineageNode: LineageNodeComponent,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 350, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 150,
        y: nodeWithPosition.y - 60,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const DataLineageExplorer: FC<DataLineageExplorerProps> = ({
  catalog,
  projectMetadata,
  paramOverrides
}) => {
  const [detailsNode, setDetailsNode] = useState<{ id: string; type: 'model' | 'dataset' | 'dashboard'; name: string } | null>(null);

  const initialElements = useMemo(() => {
    const nodes: LineageNode[] = [];
    const edges: Edge[] = [];

    const nodeMap = new Map<string, LineageNode>();

    const getOrCreateNode = (name: string, type: 'model' | 'dataset' | 'dashboard') => {
      const id = `${type}:${name}`;
      if (nodeMap.has(id)) return nodeMap.get(id)!;

      let label = name;
      let modelType: any = undefined;

      if (type === 'model') {
        const model = catalog.models?.find(m => m.name === name);
        modelType = model?.model_type;
      } else if (type === 'dataset') {
        const dataset = catalog.datasets.find(d => d.name === name);
        label = dataset?.label || name;
      } else if (type === 'dashboard') {
        const dashboard = catalog.dashboards.find(d => d.name === name);
        label = dashboard?.label || name;
      }

      const node: LineageNode = {
        id,
        type: 'lineageNode',
        data: {
          label,
          type,
          modelType,
          onShowDetails: () => setDetailsNode({ id, type, name }),
        },
        position: { x: 0, y: 0 },
      };

      nodeMap.set(id, node);
      nodes.push(node);
      return node;
    };

    catalog.lineage?.forEach((rel, idx) => {
      const sourceNode = getOrCreateNode(rel.source.name, rel.source.type);
      const targetNode = getOrCreateNode(rel.target.name, rel.target.type);

      edges.push({
        id: `e${idx}`,
        source: sourceNode.id,
        target: targetNode.id,
        animated: rel.type === 'runtime',
        style: {
          strokeDasharray: rel.type === 'buildtime' ? '5 5' : 'none',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
    });

    // Also include any models/datasets/dashboards that might not be in lineage if we want
    // But for now let's stick to the lineage relations
    
    return getLayoutedElements(nodes, edges);
  }, [catalog]);

  const [nodes, , onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initialElements.edges);

  return (
    <div className="h-full w-full bg-muted/10 relative">
      <style>{`
        .react-flow__controls {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          border: 1px border;
          border-radius: 8px;
          overflow: hidden;
        }
        .dark .react-flow__controls {
          background-color: var(--card);
          border-color: var(--border);
        }
        .dark .react-flow__controls-button {
          background-color: var(--card);
          color: var(--foreground);
          border-bottom: 1px solid var(--border);
        }
        .dark .react-flow__controls-button:hover {
          background-color: var(--accent);
        }
        .dark .react-flow__controls-button svg {
          fill: var(--foreground);
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        
        <Panel position="top-left" className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Data Lineage Graph</h3>
            <p className="text-xs text-muted-foreground">Showing relationships between models, datasets, and dashboards</p>
          </div>
        </Panel>

        <Panel position="top-right" className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
          <div className="space-y-3 min-w-[150px]">
            <h4 className="font-black text-muted-foreground uppercase tracking-widest text-[14px]">Legend</h4>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Node Types</p>
              <div className="grid grid-cols-1 gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-100 border border-slate-400" />
                  <span className="text-xs">Model</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600" />
                  <span className="text-xs">Dataset</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-600" />
                  <span className="text-xs">Dashboard</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Edge Types</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 flex items-center">
                    <svg width="100%" height="10" viewBox="0 0 32 10" className="text-muted-foreground fill-current">
                      <line x1="0" y1="5" x2="26" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                      <path d="M24 2 L30 5 L24 8 Z" />
                    </svg>
                  </div>
                  <span className="text-xs">Buildtime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 flex items-center">
                    <svg width="100%" height="10" viewBox="0 0 32 10" className="text-muted-foreground fill-current">
                      <line x1="0" y1="5" x2="26" y2="5" stroke="currentColor" strokeWidth="2" />
                      <path d="M24 2 L30 5 L24 8 Z" />
                    </svg>
                  </div>
                  <span className="text-xs">Runtime</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      <LineageDetailsDialog
        isOpen={!!detailsNode}
        onOpenChange={(open) => !open && setDetailsNode(null)}
        node={detailsNode}
        catalog={catalog}
        projectMetadata={projectMetadata}
        paramOverrides={paramOverrides}
      />
    </div>
  );
};

export default DataLineageExplorer;
