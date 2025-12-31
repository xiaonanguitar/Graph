import React, { useRef, useEffect } from "react";
import LogicFlow from "@logicflow/core";
import { BPMNAdapter } from '@logicflow/extension';
import "@logicflow/core/dist/index.css";

LogicFlow.use(BPMNAdapter);
/* UI styles */
const styles = `
.logicflow-app { display:flex; height:100%; min-height:420px; font-family: Arial, Helvetica, sans-serif; }
.logicflow-sidebar { width:180px; background:linear-gradient(180deg,#0f172a,#07143a); color:#fff; padding:12px; box-sizing:border-box; display:flex; flex-direction:column; gap:12px; }
.logicflow-sidebar h3 { margin:0 0 6px 0; font-size:13px; color:#9fb8ff; }
.palette-item { background:#0b1220; border-radius:8px; padding:10px; display:flex; align-items:center; gap:10px; cursor:grab; user-select:none; box-shadow:0 6px 14px rgba(2,6,23,0.6); transition:transform .12s; }
.palette-item:active{ cursor:grabbing; transform:scale(.98); }
.palette-sample { width:36px; height:28px; border-radius:6px; display:inline-block; box-shadow:inset 0 -4px rgba(0,0,0,0.15); }
.toolbar { height:52px; background:linear-gradient(90deg,#ffffff, #f3f7ff); display:flex; align-items:center; gap:12px; padding:8px 12px; box-sizing:border-box; border-bottom:1px solid rgba(0,0,0,0.06); }
.toolbar button { background:#fff; border:1px solid #d6e2ff; padding:8px 12px; border-radius:6px; cursor:pointer; box-shadow:0 2px 6px rgba(12,41,84,0.08); }
.toolbar .primary { background: linear-gradient(90deg,#3b82f6,#1e40af); color:#fff; border:none; }
.canvas-wrap { flex:1; display:flex; flex-direction:column; }
.canvas-area { flex:1; background: linear-gradient(180deg,#f8fafc,#eef2ff); padding:12px; box-sizing:border-box; }
.legend { color:#6b7280; font-size:12px; margin-left:auto; padding-right:8px; }
`;

/* inject styles once */
(function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("logicflow-enhanced-styles")) return;
    const s = document.createElement("style");
    s.id = "logicflow-enhanced-styles";
    s.innerHTML = styles;
    document.head.appendChild(s);
})();

/* helper download */
function downloadFile(filename, content, mime = "application/json") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/* Node palette definitions (5 styles) */
const PALETTE = [
    { type: "rect", label: "开始/结束 (矩形)", style: { fill: "#e6f7ff", stroke: "#60a5fa" }, w: 120, h: 48 },
    { type: "circle", label: "圆形节点", style: { fill: "#fff7ed", stroke: "#fb923c" }, w: 64, h: 64 },
    { type: "ellipse", label: "椭圆节点", style: { fill: "#ecfccb", stroke: "#84cc16" }, w: 120, h: 64 },
    { type: "diamond", label: "判断 (菱形)", style: { fill: "#f3e8ff", stroke: "#a78bfa" }, w: 110, h: 70 },
    { type: "polygon", label: "多边形示例", style: { fill: "#fff1f2", stroke: "#fb7185" }, w: 120, h: 60 },
];

/* Exported enhanced FlowGraph component (will replace the original component body) */
export default function FlowGraph() {
    const containerRef = React.useRef(null);
    const lfRef = React.useRef(null);
    const idSeed = React.useRef(1);

    /* initialize LogicFlow */
    React.useEffect(() => {
        if (!containerRef.current) return;

        const lf = new LogicFlow({
            container: containerRef.current,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            grid: true,
            stopScrollGraph: true,
            keyboard: true,
        });

        lfRef.current = lf;

        

        // render a minimal starting graph
        lf.render({
            nodes: [],
            edges: [],
        });

        // enable creating edges by dragging from anchor points (default interact)
        // try to ensure edge is addable via toolbar action; we provide manual connect by enabling "edge" mode toggle later if needed

        // basic event logging (optional)
        lf.on("connection.create", ({ edge }) => {
            // keep default label style if any
            console.log("连接创建：", edge);
        });

        // cleanup
        return () => {
            lf.destroy();
            lfRef.current = null;
        };
    }, []);

    /* drag & drop handlers */
    const onDragStart = (e, item) => {
        e.dataTransfer.setData("text/plain", JSON.stringify(item));
        // show dragging ghost
        const ghost = document.createElement("div");
        ghost.style.padding = "6px 10px";
        ghost.style.background = "#111827";
        ghost.style.color = "#fff";
        ghost.style.borderRadius = "6px";
        ghost.style.width = "100px";
        ghost.style.fontSize = "12px";
        ghost.textContent = item.label;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, -10, -10);
        setTimeout(() => ghost.remove(), 0);
    };

    const onCanvasDrop = (e) => {
        e.preventDefault();
        const text = e.dataTransfer.getData("text/plain");
        if (!text) return;
        let payload;
        try { payload = JSON.parse(text); } catch { return; }
        const lf = lfRef.current;
        if (!lf || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = `node_${Date.now()}_${idSeed.current++}`;
        const existingNodes = lf.getGraphData().nodes || [];
        let isOverlapping;
        do {
            isOverlapping = existingNodes.some(node => {
                return Math.abs(node.x - x) < 50 && Math.abs(node.y - y) < 50; // Adjust threshold as needed
            });
            if (isOverlapping) {
                y += 50; // Move down if overlapping
            }
        } while (isOverlapping);

        // create node options depending on type (basic)
        const base = {
            id,
            text: payload.label,
            x,
            y,
            width: payload.w || 100,
            height: payload.h || 40,
            type: payload.type,
        };

        // When LogicFlow doesn't support a named type, fallback to rect with a custom shape property
        try {
            lf.addNode(base);
            // apply style if provided via update
            if (payload.style) {
                // try to update node style via updateNode
                lf.updateNode({
                    ...base,
                    properties: { style: payload.style },
                });
            }
        } catch (err) {
            // fallback: add rect node
            lf.addNode({
                ...base,
                type: "rect",
            });
        }
    };

    const onCanvasDragOver = (e) => e.preventDefault();

    /* Toolbar actions */
    const handleSave = () => {
        const lf = lfRef.current;
        if (!lf) return;
        const bpmnXmlStr = lf.getGraphData ? lf.getGraphData() : lf.save();
        console.log(bpmnXmlStr);

    };

    const handleLoad = () => {
        const lf = lfRef.current;
        if (!lf) return;
        const raw = localStorage.getItem("logicflow_demo_save");
        if (!raw) { alert("没有本地保存"); return; }
        try {
            const d = JSON.parse(raw);
            lf.render(d);
        } catch (err) {
            alert("加载失败：" + err.message);
        }
    };

    const handleExportBpmn = () => {
        const lf = lfRef.current;
        if (!lf) return;
        const data = lf.getGraphData ? lf.getGraphData() : lf.save();
        // simple JSON -> file with .bpmn extension (structure is logicflow json; converting to real BPMN XML is out of scope)
        downloadFile(`logicflow_${Date.now()}.bpmn`, JSON.stringify(data, null, 2), "application/xml");
    };

    const handleUndo = () => {
        const lf = lfRef.current;
        if (!lf) return;
        if (lf.commandManager && typeof lf.commandManager.undo === "function") {
            lf.commandManager.undo();
            return;
        }
        if (typeof lf.undo === "function") {
            lf.undo();
            return;
        }
        // fallback: no-op
    };

    const handleClear = () => {
        const lf = lfRef.current;
        if (!lf) return;
        lf.render({ nodes: [], edges: [] });
    };

    /* Render JSX UI */
    return (
        <div className="logicflow-app">
            <div className="logicflow-sidebar" aria-hidden="true">
                <h3>节点工具箱</h3>
                {PALETTE.map((p) => (
                    <div
                        key={p.type}
                        className="palette-item"
                        draggable
                        onDragStart={(e) => onDragStart(e, p)}
                        title={`拖拽到右侧画布：${p.label}`}
                    >
                        <div
                            className="palette-sample"
                            style={{
                                background: p.style?.fill || "#fff",
                                border: `2px solid ${p.style?.stroke || "#cbd5e1"}`,
                                borderRadius: p.type === "circle" ? "50%" : p.type === "diamond" ? "6px" : "6px",
                                width: p.type === "circle" ? 44 : 36,
                                height: p.type === "circle" ? 44 : 28,
                                transform: p.type === "diamond" ? "rotate(45deg) scale(.9)" : "none",
                                boxShadow: "0 4px 10px rgba(2,6,23,0.35)",
                            }}
                        />
                        <div style={{ fontSize: 12, color: "#e6eefc" }}>{p.label}</div>
                    </div>
                ))}
                <div style={{ marginTop: "auto", fontSize: 12, color: "#9fb8ff" }}>
                    提示：拖拽节点到右侧画布，选中节点后可连接创建连线。
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="toolbar">
                    <button className="primary" onClick={handleSave}>保存</button>
                    <button onClick={handleLoad}>加载</button>
                    <button onClick={handleExportBpmn}>导出 .bpmn</button>
                    <button onClick={handleUndo}>回退</button>
                    <button onClick={handleClear}>清空</button>
                    <div className="legend">LogicFlow Demo</div>
                </div>

                <div className="canvas-wrap">
                    <div
                        className="canvas-area"
                        onDrop={onCanvasDrop}
                        onDragOver={onCanvasDragOver}
                        style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}
                    >
                        <div
                            ref={containerRef}
                            style={{ width: "100%", height: "100%", minHeight: 360, background: "transparent" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
