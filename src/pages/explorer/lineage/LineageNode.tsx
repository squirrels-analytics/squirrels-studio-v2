import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, TableIcon, LayoutDashboard } from 'lucide-react';

export type LineageNodeData = {
  label: string;
  type: 'model' | 'dataset' | 'dashboard';
  modelType?: 'source' | 'dbview' | 'federate' | 'seed' | 'build';
  onShowDetails: () => void;
};

export type LineageNode = Node<LineageNodeData>;

const LineageNodeComponent = ({ data }: NodeProps<LineageNode>) => {
  const isModel = data.type === 'model';
  const isDataset = data.type === 'dataset';
  const isDashboard = data.type === 'dashboard';

  let borderColor = 'border-border';
  let badgeColor = 'bg-muted text-muted-foreground';
  let bgColor = 'bg-card';
  let textColor = 'text-foreground';

  if (isModel) {
    bgColor = 'bg-slate-100';
    textColor = 'text-slate-900';
    borderColor = 'border-slate-200';
    switch (data.modelType) {
      case 'seed': borderColor = 'border-green-600'; badgeColor = 'bg-green-100 text-green-700'; break;
      case 'build': borderColor = 'border-red-600'; badgeColor = 'bg-red-100 text-red-700'; break;
      case 'federate': borderColor = 'border-orange-600'; badgeColor = 'bg-orange-100 text-orange-700'; break;
      case 'dbview': borderColor = 'border-purple-600'; badgeColor = 'bg-purple-100 text-purple-700'; break;
      case 'source': borderColor = 'border-blue-800'; badgeColor = 'bg-blue-100 text-blue-900'; break;
      default: badgeColor = 'bg-slate-200 text-slate-700'; break;
    }
  } else if (isDataset) {
    bgColor = 'bg-blue-600';
    borderColor = 'border-primary';
    textColor = 'text-white';
    badgeColor = 'bg-blue-800 text-white border-none';
  } else if (isDashboard) {
    bgColor = 'bg-green-600';
    borderColor = 'border-primary';
    textColor = 'text-white';
    badgeColor = 'bg-green-800 text-white border-none';
  }

  return (
    <div className={`px-4 py-3 rounded-lg border-3 shadow-md w-[300px] ${bgColor} ${borderColor} ${textColor}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-muted-foreground!" />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden">
            {isModel && <Database className={`shrink-0 w-5 h-5`} />}
            {isDataset && <TableIcon className="shrink-0 w-5 h-5" />}
            {isDashboard && <LayoutDashboard className="shrink-0 w-5 h-5" />}
            <span className="font-bold text-lg">{data.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button 
            variant="secondary" 
            size="sm" 
            className={`font-bold w-fit px-3 border cursor-pointer ${isModel ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300' : 'bg-white/30 hover:bg-white/20 text-white hover:text-white border-white/20'}`}
            onClick={(e) => {
              e.stopPropagation();
              data.onShowDetails();
            }}
          >
            Details
          </Button>

          <Badge variant="outline" className={`text-sm uppercase px-2 font-bold shrink-0 ${badgeColor}`}>
            {isModel ? data.modelType : (isDataset ? 'Dataset' : 'Dashboard')}
          </Badge>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-muted-foreground!" />
    </div>
  );
};

export default memo(LineageNodeComponent);
