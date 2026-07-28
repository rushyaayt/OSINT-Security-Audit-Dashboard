import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Info, 
  Globe, 
  Layers, 
  Server, 
  ShieldAlert, 
  Filter, 
  Maximize2 
} from 'lucide-react';
import { ScanResult } from '../types';

interface TopologyNodeLinkDiagramProps {
  scanResult: ScanResult;
  height?: number;
}

export interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'target' | 'subdomain' | 'ip' | 'port';
  status?: string;
  ip?: string;
  source?: string;
  details?: string;
  radius: number;
  color: string;
  degree?: number;
}

export interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
  type: 'domain_sub' | 'sub_ip' | 'ip_port';
}

export const TopologyNodeLinkDiagram: React.FC<TopologyNodeLinkDiagramProps> = ({
  scanResult,
  height = 520,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<NodeDatum | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeDatum | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'subdomain' | 'ip' | 'port'>('all');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height });
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Resize observer to ensure fluid layout responsive to container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.max(320, entry.contentRect.width),
            height: height,
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Construct Graph Nodes and Links from scanResult
  useEffect(() => {
    if (!svgRef.current || dimensions.width <= 0) return;

    // Clear previous SVG contents
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    const { width, height: h } = dimensions;

    // Build Graph Data
    const nodesMap = new Map<string, NodeDatum>();
    const links: LinkDatum[] = [];

    // 1. Target Root Node
    const targetNodeId = `target:${scanResult.target}`;
    nodesMap.set(targetNodeId, {
      id: targetNodeId,
      label: scanResult.target,
      type: 'target',
      status: scanResult.status,
      ip: scanResult.ipAddress,
      details: `Target Root Domain (${scanResult.subdomains.length} subdomains enumerated)`,
      radius: 22,
      color: '#6366f1', // Indigo
    });

    // 2. Primary IP Node
    if (scanResult.ipAddress && scanResult.ipAddress !== 'N/A') {
      const primaryIpId = `ip:${scanResult.ipAddress}`;
      nodesMap.set(primaryIpId, {
        id: primaryIpId,
        label: scanResult.ipAddress,
        type: 'ip',
        ip: scanResult.ipAddress,
        details: `Primary IP Address for ${scanResult.target}`,
        radius: 16,
        color: '#06b6d4', // Cyan
      });

      links.push({
        source: targetNodeId,
        target: primaryIpId,
        type: 'domain_sub',
      });
    }

    // 3. Subdomain Nodes & Subdomain IP Links
    scanResult.subdomains.forEach((sub) => {
      // Filter check
      if (
        filterType !== 'all' &&
        filterType !== 'subdomain' &&
        filterType !== 'ip'
      ) {
        return;
      }

      if (
        searchTerm &&
        !sub.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !sub.ip.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return;
      }

      const subId = `sub:${sub.subdomain}`;
      nodesMap.set(subId, {
        id: subId,
        label: sub.subdomain,
        type: 'subdomain',
        status: sub.status,
        ip: sub.ip,
        source: sub.source,
        details: `Discovered Subdomain via ${sub.source}`,
        radius: 13,
        color: sub.status === 'active' ? '#10b981' : '#64748b', // Emerald for active, Slate for unreachable
      });

      // Link Target -> Subdomain
      links.push({
        source: targetNodeId,
        target: subId,
        type: 'domain_sub',
      });

      // IP Node for Subdomain
      if (sub.ip && sub.ip !== 'N/A' && sub.ip !== '0.0.0.0') {
        const subIpId = `ip:${sub.ip}`;
        if (!nodesMap.has(subIpId)) {
          nodesMap.set(subIpId, {
            id: subIpId,
            label: sub.ip,
            type: 'ip',
            ip: sub.ip,
            details: `Host Cluster IP ${sub.ip}`,
            radius: 15,
            color: '#06b6d4',
          });
        }

        // Link Subdomain -> IP Cluster
        links.push({
          source: subId,
          target: subIpId,
          type: 'sub_ip',
        });
      }
    });

    // 4. Open Ports Nodes (linked to Primary IP)
    if (filterType === 'all' || filterType === 'port') {
      const targetIpId = `ip:${scanResult.ipAddress}`;
      if (nodesMap.has(targetIpId)) {
        scanResult.openPorts.forEach((portItem) => {
          if (
            searchTerm &&
            !String(portItem.port).includes(searchTerm) &&
            !portItem.service.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return;
          }

          const portId = `port:${portItem.port}`;
          let portColor = '#3b82f6'; // Blue
          if (portItem.risk === 'high') portColor = '#ef4444'; // Red
          else if (portItem.risk === 'medium') portColor = '#f59e0b'; // Amber

          nodesMap.set(portId, {
            id: portId,
            label: `Port ${portItem.port} (${portItem.service.toUpperCase()})`,
            type: 'port',
            status: portItem.status,
            details: `Service: ${portItem.service} | Protocol: ${portItem.protocol} | Risk: ${portItem.risk.toUpperCase()}`,
            radius: 11,
            color: portColor,
          });

          links.push({
            source: targetIpId,
            target: portId,
            type: 'ip_port',
          });
        });
      }
    }

    const nodes = Array.from(nodesMap.values());

    // SVG Container Setup
    const svg = svgElement
      .attr('width', width)
      .attr('height', h)
      .attr('viewBox', [0, 0, width, h])
      .attr('style', 'max-width: 100%; height: auto; cursor: grab;');

    // Defs for Glow Filters and Markers
    const defs = svg.append('defs');

    // Glow Filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Root Halo Gradient
    const rootGrad = defs.append('radialGradient').attr('id', 'root-halo');
    rootGrad.append('stop').attr('offset', '0%').attr('stop-color', '#818cf8').attr('stop-opacity', '0.6');
    rootGrad.append('stop').attr('offset', '100%').attr('stop-color', '#6366f1').attr('stop-opacity', '0');

    // Zoom Layer
    const g = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    // Force Simulation Setup
    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance((d) => (d.type === 'domain_sub' ? 120 : d.type === 'sub_ip' ? 90 : 70))
      )
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, h / 2))
      .force('collide', d3.forceCollide<NodeDatum>().radius((d) => d.radius + 15));

    // Render Links
    const linkGroup = g.append('g').attr('class', 'links');

    const link = linkGroup
      .selectAll<SVGLineElement, LinkDatum>('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => {
        if (d.type === 'domain_sub') return '#475569';
        if (d.type === 'sub_ip') return '#0284c7';
        return '#3b82f6';
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => (d.type === 'domain_sub' ? 2 : 1.5))
      .attr('stroke-dasharray', (d) => (d.type === 'sub_ip' ? '3,3' : 'none'));

    // Render Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const node = nodeGroup
      .selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-item')
      .attr('style', 'cursor: pointer;')
      .call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Outer Glow / Halo for Target Node
    node
      .filter((d) => d.type === 'target')
      .append('circle')
      .attr('r', 36)
      .attr('fill', 'url(#root-halo)')
      .attr('class', 'animate-pulse');

    // Main Circle
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.5)
      .attr('filter', (d) => (d.type === 'target' ? 'url(#glow)' : 'none'))
      .attr('transition', 'all 0.2s');

    // Node Icons or Symbols inside circles
    node.each(function (d) {
      const el = d3.select(this);
      if (d.type === 'target') {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#ffffff')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text('🌐');
      } else if (d.type === 'ip') {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#ffffff')
          .attr('font-size', '10px')
          .text('🖥️');
      } else if (d.type === 'port') {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#ffffff')
          .attr('font-size', '9px')
          .text('⚡');
      }
    });

    // Node Text Labels
    const labels = node
      .append('text')
      .attr('dx', (d) => d.radius + 6)
      .attr('dy', '0.35em')
      .attr('fill', (d) => (d.type === 'target' ? '#f8fafc' : '#cbd5e1'))
      .attr('font-size', (d) => (d.type === 'target' ? '12px' : '10px'))
      .attr('font-weight', (d) => (d.type === 'target' ? '700' : '500'))
      .attr('font-family', 'monospace')
      .text((d) => d.label);

    // Hover & Click Interaction
    node
      .on('mouseover', (_event, d) => {
        setHoveredNode(d);

        // Highlight connected links
        link
          .attr('stroke', (l) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            if (sourceId === d.id || targetId === d.id) return '#fbbf24'; // Amber highlight
            return '#334155';
          })
          .attr('stroke-width', (l) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            if (sourceId === d.id || targetId === d.id) return 3;
            return 1;
          })
          .attr('stroke-opacity', (l) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            if (sourceId === d.id || targetId === d.id) return 1;
            return 0.2;
          });
      })
      .on('mouseout', () => {
        setHoveredNode(null);

        // Reset links styling
        link
          .attr('stroke', (d) => {
            if (d.type === 'domain_sub') return '#475569';
            if (d.type === 'sub_ip') return '#0284c7';
            return '#3b82f6';
          })
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', (d) => (d.type === 'domain_sub' ? 2 : 1.5));
      })
      .on('click', (_event, d) => {
        setSelectedNode(d);
      });

    // Tick function to update positions
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NodeDatum).x || 0)
        .attr('y1', (d) => (d.source as NodeDatum).y || 0)
        .attr('x2', (d) => (d.target as NodeDatum).x || 0)
        .attr('y2', (d) => (d.target as NodeDatum).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Drag Helper Functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [scanResult, dimensions, filterType, searchTerm]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl relative overflow-hidden">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xs uppercase font-mono font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Interactive Topology Map
            </span>
            <span className="text-3xs font-mono text-slate-400">D3 Force Simulation</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5 font-mono">
            Attack Surface Node-Link Relationships
          </h3>
          <p className="text-xs text-slate-400">
            Mapping connection vectors between domain <strong className="text-indigo-300">{scanResult.target}</strong>, enumerated subdomains, and IP address clusters.
          </p>
        </div>

        {/* Filter and Search controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search host or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Filter Type */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('subdomain')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'subdomain' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Subs
            </button>
            <button
              onClick={() => setFilterType('ip')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'ip' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              IPs
            </button>
            <button
              onClick={() => setFilterType('port')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'port' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Ports
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-slate-400">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset View"
              className="p-1 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* D3 Canvas Visualization Stage */}
      <div className="relative bg-slate-950/90 rounded-lg border border-slate-900 overflow-hidden min-h-[480px]">
        <svg ref={svgRef} className="w-full block" />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-3 rounded-lg space-y-1.5 text-3xs font-mono text-slate-300 pointer-events-none">
          <div className="text-2xs font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">
            Topology Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-400 shrink-0"></span>
            <span>Target Root Domain</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Active Subdomain</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"></span>
            <span>Unreachable Subdomain</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
            <span>IP Address Cluster</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
            <span>Exposed Open Port</span>
          </div>
        </div>

        {/* Hover / Selected Node Tooltip or Sidebar Overlay */}
        {(hoveredNode || selectedNode) && (
          <div className="absolute top-3 right-3 max-w-xs w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs font-mono text-slate-200 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-3xs uppercase font-bold text-indigo-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Node Details
              </span>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-300 text-2xs"
                >
                  Close
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-100 truncate">
                {(hoveredNode || selectedNode)?.label}
              </div>
              <div className="text-2xs text-slate-400 capitalize">
                Type: <strong className="text-cyan-400">{(hoveredNode || selectedNode)?.type}</strong>
              </div>
              {(hoveredNode || selectedNode)?.ip && (
                <div className="text-2xs text-slate-400">
                  IP: <strong className="text-slate-200">{(hoveredNode || selectedNode)?.ip}</strong>
                </div>
              )}
              {(hoveredNode || selectedNode)?.source && (
                <div className="text-2xs text-slate-400">
                  Source: <span className="text-amber-300">{(hoveredNode || selectedNode)?.source}</span>
                </div>
              )}
              <p className="text-3xs text-slate-300 pt-1 border-t border-slate-800/80">
                {(hoveredNode || selectedNode)?.details}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex items-center justify-between text-2xs font-mono text-slate-400 border-t border-slate-800/80 pt-2">
        <span>
          Showing <strong>{scanResult.subdomains.length}</strong> subdomains & <strong>{scanResult.openPorts.length}</strong> open ports mapped to IP clusters.
        </span>
        <span className="text-slate-500">
          Tip: Click & drag nodes to customize topology layout. Scroll to zoom.
        </span>
      </div>
    </div>
  );
};

export default TopologyNodeLinkDiagram;
