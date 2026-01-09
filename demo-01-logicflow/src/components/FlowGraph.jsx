import React, { useRef, useState } from "react";
import LogicFlow from "@logicflow/core";
import {
  CircleNode,
  CircleNodeModel,
  RectNode,
  RectNodeModel,
  PolygonNode,
  PolygonNodeModel,
  DiamondNode,  DiamondNodeModel,
  h,
} from "@logicflow/core";
import { PolylineEdge, PolylineEdgeModel } from '@logicflow/core';
import { BPMNAdapter } from "@logicflow/extension";
import "@logicflow/core/dist/index.css";
import axios from 'axios';

// 自定义开始节点 - 圆形
class StartNode extends CircleNode {
}

class StartNodeModel extends CircleNodeModel {
  constructor(data, graphModel) {
    super(data, graphModel);
    this.r = 60;
    this.strokeWidth = 2;
    this.stroke = '#1E90FF';
    this.fill = '#e6f7ff';
  }
}

// 自定义结束节点 - 圆形
class EndNode extends CircleNode {
}

class EndNodeModel extends CircleNodeModel {
  constructor(data, graphModel) {
    super(data, graphModel);
    this.r = 60;
    this.strokeWidth = 2;
    this.stroke = '#FF4500';
    this.fill = '#fff0f0';
  }
}

// 自定义用户任务节点 - 矩形
class UserTaskNodeModel extends RectNodeModel {
  setAttributes() {
    const width = 140;
    const height = 100;
    
    this.width = width;
    this.height = height;
    this.stroke = '#10b981';
    this.fill = '#ecfdf5';
    
    // 设置锚点偏移，使节点可以连接
    this.anchorsOffset = [
      [width / 2, 0],    // 右侧中心
      [-width / 2, 0],   // 左侧中心
      [0, -height / 2],  // 顶部中心
      [0, height / 2]    // 底部中心
    ];
    
    // 安全地设置默认属性，避免递归调用
    const defaultProps = {
      title: '用户任务',
      content: '',
      status: 'not-started' // 'not-started', 'processing', 'completed'
    };
    
    // 合并默认属性和传入的属性
    this.properties = {
      ...defaultProps,
      ...(this.getData().properties || {})
    };
  }
}

// 用户任务节点视图
class UserTaskNodeView extends RectNode {
  getShape() {
    // 通过 getAttributes 获取 model 中的属性
    const { 
      x, 
      y, 
      width, 
      height, 
      fill, 
      stroke, 
      strokeWidth,
      properties 
    } = this.props.model;
    
    const { title, content, status } = properties;

    // 确定状态栏样式
    let statusBg, statusColor, statusText;
    switch(status) {
      case 'completed':
        statusBg = '#bbf7d0';
        statusColor = '#22c55e';
        statusText = '已完成';
        break;
      case 'processing':
        statusBg = '#dbeafe';
        statusColor = '#3b82f6';
        statusText = '处理中';
        break;
      default:
        statusBg = '#fee2e2';
        statusColor = '#ef4444';
        statusText = '未开始';
    }

    // 计算各区域尺寸
    const titleHeight = 30;
    const contentHeight = 45;
    const statusHeight = 25;
    const totalHeight = titleHeight + contentHeight + statusHeight;
    
    // 创建容器组
    return h("g", {}, [
      // 主容器矩形
      h("rect", {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        fill: '#ecfdf5',
        stroke,
        strokeWidth: 1,
        rx: 6,
        ry: 6
      }),
      
      // 标题区域矩形
      h("rect", {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height: titleHeight,
        fill: '#10b981',
        stroke: 'none',
        rx: 6,
        ry: 6
      }),
      
      // 标题文本
      h("text", {
        x,
        y: y - height / 2 + titleHeight / 2,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontWeight: 'bold',
        fontSize: 13
      }, title || '用户任务'),
      
      // 内容区域矩形
      h("rect", {
        x: x - width / 2,
        y: y - height / 2 + titleHeight,
        width,
        height: contentHeight,
        fill: '#f0fdf4',
        stroke: 'none'
      }),
      
      // 内容文本
      h("text", {
        x,
        y: y - height / 2 + titleHeight + contentHeight / 2,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#333',
        fontSize: 12,
        style: {
          wordWrap: 'break-word',
          textAlign: 'center',
          padding: '5px'
        }
      }, content || ''),
      
      // 状态区域矩形
      h("rect", {
        x: x - width / 2,
        y: y - height / 2 + titleHeight + contentHeight,
        width,
        height: statusHeight,
        fill: statusBg,
        stroke: 'none',
        rx: 0,
        ry: 6 // 只有底部圆角
      }),
      
      // 状态文本
      h("text", {
        x,
        y: y - height / 2 + titleHeight + contentHeight + statusHeight / 2,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: statusColor,
        fontSize: 11,
        fontWeight: 'normal'
      }, statusText)
    ]);
  }
}

// 自定义排他网关节点 - 菱形
class ExclusiveGatewayModel extends DiamondNodeModel {
  setAttributes() {
    // 定义菱形的四个顶点，相对于中心点的坐标
    // 这些坐标应该与BPMN中定义的bounds保持一致
  // 左

    this.stroke = '#8b5cf6';
    this.fill = '#f3e8ff';
    
    // 设置锚点偏移，确保与图形顶点对齐
    this.anchorsOffset = [
      [0, -18],   // 上锚点
      [18, 0],    // 右锚点
      [0, 18],    // 下锚点
      [-18, 0]    // 左锚点
    ];
    
    // 安全地设置默认属性
    const defaultProps = {
      title: '审批网关',
      content: '排他网关'
    };
    
    // 合并默认属性和传入的属性
    this.properties = {
      ...defaultProps,
      ...(this.getData().properties || {})
    };
  }
}

class ExclusiveGatewayView extends DiamondNode {
  getShape() {
    const { x, y, width, height, points, fill, stroke, strokeWidth, properties } = this.props.model;
    const { title } = properties;
    
    // 使用getAttributes获取正确的样式
    const style = this.props.model.s;
    
    return h(
      'g',
      {},
      [
        h(
          'polygon',
          {
            ...style,
            // 将points转换为字符串格式，符合polygon的points属性要求
            points: points.map(p => `${p[0]},${p[1]}`).join(' '),
            fill,
            stroke,
            strokeWidth,
          }
        ),
        // 添加网关符号
        h(
          'text',
          {
            x: 0,
            y: 0,
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            fill: '#333',
            fontWeight: 'bold',
            fontSize: 14
          },
          '×'
        ),
        // 添加标题
        h(
          'text',
          {
            x: 0,
            y: 25,
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            fill: '#333',
            fontSize: 12
          },
          title || '审批网关'
        )
      ]
    );
  }
}

LogicFlow.use(BPMNAdapter);

/* UI styles */
const styles = `
.logicflow-app { display:flex; height:100vh; width:100vw; font-family: Arial, Helvetica, sans-serif; }
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
    { type: "start-node", label: "开始", style: { fill: "#e6f7ff", stroke: "#1E90FF" }, w: 60, h: 60 },
    { type: "end-node", label: "结束", style: { fill: "#fff0f0", stroke: "#FF4500" }, w: 60, h: 60 },
    { type: "user-task", label: "用户任务", style: { fill: "#ecfdf5", stroke: "#10b981" }, w: 140, h: 100 },
    { type: "exclusive-gateway", label: "审批网关", style: { fill: "#f3e8ff", stroke: "#8b5cf6" }, w: 80, h: 80 },
    { type: "polygon", label: "多边形示例", style: { fill: "#fff1f2", stroke: "#fb7185" }, w: 120, h: 60 },
];

/* Exported enhanced FlowGraph component */
export default function FlowGraph() {
    const containerRef = useRef(null);
    const lfRef = useRef(null);
    const idSeed = useRef(1);

    /* initialize LogicFlow */
    React.useEffect(() => {
        if (!containerRef.current) return;

        const lf = new LogicFlow({
            container: containerRef.current,
            grid: true,
            stopScrollGraph: true,
            keyboard: true,
            // 自适应容器大小
            adjustWidth: '100%',
            adjustHeight: '100%',
        });

        // 注册自定义节点
        lf.register({
          type: 'start-node',
          view: StartNode,
          model: StartNodeModel,
        });
        
        lf.register({
          type: 'end-node',
          view: EndNode,
          model: EndNodeModel,
        });
        
        lf.register({
          type: 'user-task',
          view: UserTaskNodeView,
          model: UserTaskNodeModel,
        });
        
        lf.register({
          type: 'exclusive-gateway',
          view: ExclusiveGatewayView,
          model: ExclusiveGatewayModel,
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
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        const id = `node_${Date.now()}_${idSeed.current++}`;
        
        // 修复循环中函数的问题 - 将函数提取到循环外
        const isNodeOverlapping = (node) => {
          return Math.abs(node.x - x) < 50 && Math.abs(node.y - y) < 50;
        };
        
        const existingNodes = lf.getGraphData().nodes || [];
        let isOverlapping;
        
        do {
            isOverlapping = existingNodes.some(isNodeOverlapping);
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
            type: payload.type,
        };

        // 根据类型设置节点尺寸
        if (payload.type === 'start-node' || payload.type === 'end-node') {
            // 圆形节点，宽度和高度应该相等
            base.width = payload.w || 60;
            base.height = payload.w || 60; // 确保圆形节点是圆的
        } else if(payload.type === 'exclusive-gateway') {
            base.width = payload.w || 80;
            base.height = payload.h || 80;
        } else {
            // 矩形节点
            base.width = payload.w || 140;
            base.height = payload.h || 100;
        }

        // When LogicFlow doesn't support a named type, fallback to rect with a custom shape property
        try {
            lf.addNode(base);
            // apply style if provided via update
            if (payload.style) {
                // try to update node style via updateNode
                lf.setProperties(base.id, { style: payload.style });
            }
        } catch (err) {
            console.error("添加节点时出错:", err);
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

    const handleViewJson = () => {
        const lf = lfRef.current;
        if (!lf) return;
        const data = lf.getGraphData ? lf.getGraphData() : lf.save();
        // 将数据以格式化的JSON形式打印到控制台
        console.log(JSON.stringify(data, null, 2));
    };

    const handleImportBpmn = () => {
        const lf = lfRef.current;
        if (!lf) return;
        
        // 这里导入预设的请假流程BPMN内容
        let leaveProcessBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:flowable="http://flowable.org/bpmn"
  targetNamespace="http://www.flowable.org/processdef">
  
  <bpmn2:process id="leaveProcess" name="请假流程" isExecutable="true">
    <bpmn2:startEvent id="startEvent" name="开始"/>
    
    <bpmn2:userTask id="applyTask" name="提交请假申请" flowable:assignee="\${applicant}">
      <bpmn2:extensionElements>
        <flowable:formProperty id="leaveType" name="请假类型" type="string" required="true"/>
        <flowable:formProperty id="reason" name="请假原因" type="string" required="true"/>
        <flowable:formProperty id="startDate" name="开始日期" type="date" datePattern="yyyy-MM-dd" required="true"/>
        <flowable:formProperty id="endDate" name="结束日期" type="date" datePattern="yyyy-MM-dd" required="true"/>
      </bpmn2:extensionElements>
    </bpmn2:userTask>
    
    <bpmn2:exclusiveGateway id="approvalGateway" name="审批网关"/>
    
    <bpmn2:userTask id="managerApprovalTask" name="经理审批" flowable:assignee="\${manager}">
      <bpmn2:extensionElements>
        <flowable:formProperty id="approvalResult" name="审批结果" type="enum" required="true">
          <flowable:value id="approved" name="批准"/>
          <flowable:value id="rejected" name="拒绝"/>
        </flowable:formProperty>
        <flowable:formProperty id="comments" name="审批意见" type="string"/>
      </bpmn2:extensionElements>
    </bpmn2:userTask>
    
    <bpmn2:userTask id="hrApprovalTask" name="HR审批" flowable:assignee="hr">
      <bpmn2:extensionElements>
        <flowable:formProperty id="hrApprovalResult" name="审批结果" type="enum" required="true">
          <flowable:value id="approved" name="批准"/>
          <flowable:value id="rejected" name="拒绝"/>
        </flowable:formProperty>
        <flowable:formProperty id="hrComments" name="审批意见" type="string"/>
      </bpmn2:extensionElements>
    </bpmn2:userTask>
    
    <bpmn2:endEvent id="endEvent" name="结束"/>
    
    <bpmn2:sequenceFlow id="flow1" sourceRef="startEvent" targetRef="applyTask"/>
    <bpmn2:sequenceFlow id="flow2" sourceRef="applyTask" targetRef="approvalGateway"/>
    <bpmn2:sequenceFlow id="flow3" sourceRef="approvalGateway" targetRef="managerApprovalTask">
      <bpmn2:conditionExpression>4</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
    <bpmn2:sequenceFlow id="flow4" sourceRef="approvalGateway" targetRef="hrApprovalTask">
      <bpmn2:conditionExpression>4</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
    <bpmn2:sequenceFlow id="flow5" sourceRef="managerApprovalTask" targetRef="endEvent"/>
    <bpmn2:sequenceFlow id="flow6" sourceRef="hrApprovalTask" targetRef="endEvent"/>
  </bpmn2:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_leaveProcess">
    <bpmndi:BPMNPlane bpmnElement="leaveProcess" id="BPMNPlane_leaveProcess">
      <bpmndi:BPMNShape bpmnElement="startEvent" id="BPMNShape_startEvent">
        <dc:Bounds height="30.0" width="30.0" x="100.0" y="150.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="applyTask" id="BPMNShape_applyTask">
        <dc:Bounds height="80.0" width="100.0" x="180.0" y="125.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="approvalGateway" id="BPMNShape_approvalGateway">
        <dc:Bounds height="60.0" width="60.0" x="320.0" y="135.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="managerApprovalTask" id="BPMNShape_managerApprovalTask">
        <dc:Bounds height="80.0" width="100.0" x="200.0" y="250.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="hrApprovalTask" id="BPMNShape_hrApprovalTask">
        <dc:Bounds height="80.0" width="100.0" x="420.0" y="125.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="endEvent" id="BPMNShape_endEvent">
        <dc:Bounds height="28.0" width="28.0" x="570.0" y="151.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge bpmnElement="flow1" id="BPMNEdge_flow1">
        <di:waypoint x="130.0" y="165.0"/>
        <di:waypoint x="180.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow2" id="BPMNEdge_flow2">
        <di:waypoint x="280.0" y="165.0"/>
        <di:waypoint x="330.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow3" id="BPMNEdge_flow3">
        <di:waypoint x="350.0" y="165.0"/>
        <di:waypoint x="350.0" y="290.0"/>
        <di:waypoint x="250.0" y="290.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow4" id="BPMNEdge_flow4">
        <di:waypoint x="370.0" y="165.0"/>
        <di:waypoint x="470.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow5" id="BPMNEdge_flow5">
        <di:waypoint x="250.0" y="250.0"/>
        <di:waypoint x="250.0" y="165.0"/>
        <di:waypoint x="570.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow6" id="BPMNEdge_flow6">
        <di:waypoint x="520.0" y="165.0"/>
        <di:waypoint x="570.0" y="165.0"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

        // 更精确地预处理BPMN XML，只替换标签和属性中的命名空间前缀
        // 1. 先转义特殊字符（在引号内的内容）
        leaveProcessBpmn = leaveProcessBpmn.replace(/\$\{([^}]+)\}/g, '{$1}');
        
        // 2. 替换开始标签中的命名空间前缀
        leaveProcessBpmn = leaveProcessBpmn.replace(/<(\w+):([\w\-]+)/g, '<$2');
        
        // 3. 替换结束标签中的命名空间前缀
        leaveProcessBpmn = leaveProcessBpmn.replace(/<\/(\w+):([\w\-]+)/g, '</$2');
        
        // 4. 替换属性中的命名空间前缀（注意不能影响属性值中的{}内容）
        leaveProcessBpmn = leaveProcessBpmn.replace(/\s+(\w+:)([\w\-]+)=/g, ' $2=');

        // 简单解析BPMN XML并映射到LogicFlow节点
        try {
            // 使用DOMParser解析XML
            const parser = new DOMParser();
            let xmlDoc = parser.parseFromString(leaveProcessBpmn, "text/xml");
            
            // 检查解析错误
            const parserError = xmlDoc.querySelector("parsererror");
            if (parserError) {
                console.error("XML解析错误:", parserError.textContent);
                console.log("预处理后的XML片段:");
                console.log(leaveProcessBpmn.substring(0, 1000)); // 打印前1000个字符
                throw new Error("XML格式无效");
            }

            // 清空现有内容
            lf.clearData();

            // 获取流程定义和布局信息
            const processElement = xmlDoc.querySelector('[id="leaveProcess"]');
            const diagramElement = xmlDoc.querySelector('[id="BPMNPlane_leaveProcess"]');
            
            if (!processElement || !diagramElement) {
                console.log("XML结构:", xmlDoc.documentElement.outerHTML.substring(0, 500));
                throw new Error("找不到有效的流程定义或布局信息");
            }
            
            // 获取所有的形状元素（节点）
            const shapes = Array.from(diagramElement.children).filter(child => 
                child.tagName.toLowerCase().includes('shape')
            );

            // 获取所有的连线元素
            const edges = Array.from(diagramElement.children).filter(child => 
                child.tagName.toLowerCase().includes('edge')
            );

            // 创建节点映射
            const nodeMap = {};

            // 处理形状节点
            shapes.forEach(shape => {
                // 修复获取bpmnElementId的逻辑
                const bpmnElementId = shape.getAttribute('bpmnelement') || shape.getAttribute('bpmnElement');
                
                if (!bpmnElementId) {
                    console.warn('无法获取bpmnElementId:', shape);
                    return;
                }
                
                // 在process中查找对应元素
                const bpmnElement = processElement.querySelector(`[id="${bpmnElementId}"]`);
                
                if(!bpmnElement) {
                    console.warn(`找不到BPMN元素: ${bpmnElementId}`);
                    return;
                }
                
                // 查找边界信息
                const bounds = Array.from(shape.children).find(child => 
                    child.tagName.toLowerCase().includes('bounds')
                );
                
                if(bounds) {
                    const x = parseFloat(bounds.getAttribute('x')) + parseFloat(bounds.getAttribute('width')) / 2;
                    const y = parseFloat(bounds.getAttribute('y')) + parseFloat(bounds.getAttribute('height')) / 2;
                    
                    let nodeType = 'user-task'; // 默认类型
                    let title = bpmnElement.getAttribute('name') || bpmnElementId; // 使用name属性作为标题
                    
                    // 根据BPMN元素类型确定LogicFlow节点类型
                    if(bpmnElement.tagName.toLowerCase().includes('startevent')) {
                        nodeType = 'start-node';
                        title = bpmnElement.getAttribute('name') || '开始';
                    } else if(bpmnElement.tagName.toLowerCase().includes('endevent')) {
                        nodeType = 'end-node';
                        title = bpmnElement.getAttribute('name') || '结束';
                    } else if(bpmnElement.tagName.toLowerCase().includes('exclusivegateway')) {
                        nodeType = 'exclusive-gateway';
                        title = bpmnElement.getAttribute('name') || '审批网关';
                    } else if(bpmnElement.tagName.toLowerCase().includes('usertask')) {
                        nodeType = 'user-task';
                        title = bpmnElement.getAttribute('name') || '用户任务';
                    }
                    
                    const node = {
                        id: bpmnElementId,
                        type: nodeType,
                        x: x,
                        y: y,
                        text: title,
                        properties: {
                            title: title,
                            content: title,
                            status: 'not-started'
                        }
                    };
                    
                    // 根据不同类型设置尺寸
                    if(nodeType === 'start-node' || nodeType === 'end-node') {
                        node.width = 60;
                        node.height = 60;
                    } else if(nodeType === 'exclusive-gateway') {
                        // 对于排他网关，我们不需要显式设置宽高，因为其大小由points定义决定
                        // 删除手动设置的宽高，让模型使用默认的points定义
                    } else {
                        node.width = 140;
                        node.height = 100;
                    }
                    
                    lf.addNode(node);
                    nodeMap[bpmnElementId] = { x, y };
                }
            });

            // 处理连线
            edges.forEach(edge => {
                const bpmnElementId = edge.getAttribute('bpmnelement') || edge.getAttribute('bpmnElement');
                
                if (!bpmnElementId) {
                    console.warn('无法获取连线的bpmnElementId:', edge);
                    return;
                }
                
                // 在process中查找对应元素
                const flowElement = processElement.querySelector(`[id="${bpmnElementId}"]`);
                if(flowElement) {
                    const sourceRef = flowElement.getAttribute('sourceref') || flowElement.getAttribute('sourceRef');
                    const targetRef = flowElement.getAttribute('targetref') || flowElement.getAttribute('targetRef');
                    
                    // 检查源节点和目标节点是否存在
                    if(nodeMap[sourceRef] && nodeMap[targetRef]) {
                        // 创建连线
                        lf.addEdge({
                            id: bpmnElementId,
                            type: 'polyline',
                            sourceNodeId: sourceRef,
                            targetNodeId: targetRef,
                            text: ''
                        });
                    } else {
                        console.warn(`跳过连线 ${bpmnElementId}: 源节点或目标节点不存在 (${sourceRef} -> ${targetRef})`);
                    }
                }
            });

            // 调整视图以适应画布
            lf.fitView();
            
            console.log('BPMN流程图已加载');
        } catch (err) {
            console.error('加载BPMN流程失败：', err);
            alert("加载BPMN流程失败：" + err.message);
        }
    };

    const handleDeployProcess = async () => {
        try {
            const lf = lfRef.current;
            if (!lf) {
                alert('流程图未初始化');
                return;
            }

            // 获取当前流程图数据
            const graphData = lf.getGraphData();
            
            // 首先检查是否有任何节点
            if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
                // 如果没有节点，使用默认的请假流程BPMN内容
                let defaultBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:flowable="http://flowable.org/bpmn"
  targetNamespace="http://www.flowable.org/processdef">
  
  <bpmn2:process id="leaveProcess" name="请假流程" isExecutable="true">
    <bpmn2:startEvent id="startEvent" name="开始"/>
    
    <bpmn2:userTask id="applyTask" name="提交请假申请" flowable:assignee="\${applicant}">
      <bpmn2:extensionElements>
        <flowable:formProperty id="leaveType" name="请假类型" type="string" required="true"/>
        <flowable:formProperty id="reason" name="请假原因" type="string" required="true"/>
        <flowable:formProperty id="startDate" name="开始日期" type="date" datePattern="yyyy-MM-dd" required="true"/>
        <flowable:formProperty id="endDate" name="结束日期" type="date" datePattern="yyyy-MM-dd" required="true"/>
      </bpmn2:extensionElements>
    </bpmn2:userTask>
    
    <bpmn2:exclusiveGateway id="approvalGateway" name="审批网关"/>
    
    <bpmn2:userTask id="managerApprovalTask" name="经理审批" flowable:assignee="\${manager}">
      <bpmn2:extensionElements>
        <flowable:formProperty id="approvalResult" name="审批结果" type="enum" required="true">
          <flowable:value id="approved" name="批准"/>
          <flowable:value id="rejected" name="拒绝"/>
        </flowable:formProperty>
        <flowable:formProperty id="comments" name="审批意见" type="string"/>
      </bpmn2:extensionElements>
    </bpmn2:userTask>
    
    <bpmn2:userTask id="hrApprovalTask" name="HR审批" flowable:assignee="hr">
      <bpmn2:extensionElements>
        <flowable:formProperty id="hrApprovalResult" name="审批结果" type="enum" required="true">
          <flowable:value id="approved" name="批准"/>
          <flowable:value id="rejected" name="拒绝"/>
        </flowable:formProperty>
        <flowable:formProperty id="hrComments" name="审批意见" type="string"/>
      </bpmn2:extensionElements>
    </bpmn2:userTask>
    
    <bpmn2:endEvent id="endEvent" name="结束"/>
    
    <bpmn2:sequenceFlow id="flow1" sourceRef="startEvent" targetRef="applyTask"/>
    <bpmn2:sequenceFlow id="flow2" sourceRef="applyTask" targetRef="approvalGateway"/>
    <bpmn2:sequenceFlow id="flow3" sourceRef="approvalGateway" targetRef="managerApprovalTask">
      <bpmn2:conditionExpression>\${leaveDays &lt;= 3}</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
    <bpmn2:sequenceFlow id="flow4" sourceRef="approvalGateway" targetRef="hrApprovalTask">
      <bpmn2:conditionExpression>\${leaveDays &gt; 3}</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
    <bpmn2:sequenceFlow id="flow5" sourceRef="managerApprovalTask" targetRef="endEvent"/>
    <bpmn2:sequenceFlow id="flow6" sourceRef="hrApprovalTask" targetRef="endEvent"/>
  </bpmn2:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_leaveProcess">
    <bpmndi:BPMNPlane bpmnElement="leaveProcess" id="BPMNPlane_leaveProcess">
      <bpmndi:BPMNShape bpmnElement="startEvent" id="BPMNShape_startEvent">
        <dc:Bounds height="30.0" width="30.0" x="100.0" y="150.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="applyTask" id="BPMNShape_applyTask">
        <dc:Bounds height="80.0" width="100.0" x="180.0" y="125.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="approvalGateway" id="BPMNShape_approvalGateway">
        <dc:Bounds height="40.0" width="40.0" x="330.0" y="145.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="managerApprovalTask" id="BPMNShape_managerApprovalTask">
        <dc:Bounds height="80.0" width="100.0" x="200.0" y="250.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="hrApprovalTask" id="BPMNShape_hrApprovalTask">
        <dc:Bounds height="80.0" width="100.0" x="420.0" y="125.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="endEvent" id="BPMNShape_endEvent">
        <dc:Bounds height="28.0" width="28.0" x="570.0" y="151.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge bpmnElement="flow1" id="BPMNEdge_flow1">
        <di:waypoint x="130.0" y="165.0"/>
        <di:waypoint x="180.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow2" id="BPMNEdge_flow2">
        <di:waypoint x="280.0" y="165.0"/>
        <di:waypoint x="330.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow3" id="BPMNEdge_flow3">
        <di:waypoint x="350.0" y="165.0"/>
        <di:waypoint x="350.0" y="290.0"/>
        <di:waypoint x="250.0" y="290.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow4" id="BPMNEdge_flow4">
        <di:waypoint x="370.0" y="165.0"/>
        <di:waypoint x="470.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow5" id="BPMNEdge_flow5">
        <di:waypoint x="250.0" y="250.0"/>
        <di:waypoint x="250.0" y="165.0"/>
        <di:waypoint x="570.0" y="165.0"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="flow6" id="BPMNEdge_flow6">
        <di:waypoint x="520.0" y="165.0"/>
        <di:waypoint x="570.0" y="165.0"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

                // 发送默认BPMN到服务器
                const formData = new FormData();
                formData.append('bpmnXml', defaultBpmn);
                formData.append('processName', '请假流程');
                
                const response = await axios.post('http://localhost:8086/api/deployment/deploy-with-resources', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                if (response.status === 200) {
                    alert('流程部署成功！');
                } else {
                    alert('流程部署失败：' + response.statusText);
                }
                return;
            }

            // 如果有节点，尝试将其转换为BPMN格式
            // 首先获取当前画布上的所有元素
            const data = lf.getGraphRawData();
            
            // 创建一个简化版的BPMN XML
            let bpmnContent = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   xmlns:flowable="http://flowable.org/bpmn"
                   targetNamespace="http://www.flowable.org/processdef">
  <bpmn2:process id="dynamicProcess" name="动态流程" isExecutable="true">`;

            // 处理节点
            data.nodes.forEach(node => {
                const { id, type, properties } = node;
                const name = properties.title || properties.name || id;

                switch(type) {
                    case 'start-node':
                        bpmnContent += `\n    <bpmn2:startEvent id="${id}" name="${name}"/>`;
                        break;
                    case 'end-node':
                        bpmnContent += `\n    <bpmn2:endEvent id="${id}" name="${name}"/>`;
                        break;
                    case 'user-task':
                        bpmnContent += `\n    <bpmn2:userTask id="${id}" name="${name}" flowable:assignee="\${assignee}"/>`;
                        break;
                    case 'exclusive-gateway':
                        bpmnContent += `\n    <bpmn2:exclusiveGateway id="${id}" name="${name}"/>`;
                        break;
                    default:
                        bpmnContent += `\n    <bpmn2:task id="${id}" name="${name}"/>`;
                }
            });

            // 处理连线
            data.edges.forEach(edge => {
                const { id, sourceNodeId, targetNodeId } = edge;
                bpmnContent += `\n    <bpmn2:sequenceFlow id="${id}" sourceRef="${sourceNodeId}" targetRef="${targetNodeId}"/>`;
            });

            bpmnContent += `\n  </bpmn2:process>`;
            
            // 添加BPMNDIagram部分（包含坐标信息）
            bpmnContent += `
  <bpmndi:BPMNDiagram id="BPMNDiagram_dynamicProcess">
    <bpmndi:BPMNPlane bpmnElement="dynamicProcess" id="BPMNPlane_dynamicProcess">`;

            // 为每个节点添加坐标信息
            data.nodes.forEach(node => {
                const { id, type, x, y } = node;
                let width = 100, height = 60;
                
                if (type === 'start-node' || type === 'end-node') {
                    width = 60;
                    height = 60;
                } else if (type === 'exclusive-gateway') {
                    width = 80;
                    height = 80;
                }
                
                bpmnContent += `
      <bpmndi:BPMNShape bpmnElement="${id}" id="BPMNShape_${id}">
        <dc:Bounds height="${height}" width="${width}" x="${x - width/2}" y="${y - height/2}"/>
      </bpmndi:BPMNShape>`;
            });

            // 为每条连线添加路径信息
            data.edges.forEach(edge => {
                const { id, startPoint, endPoint } = edge;
                bpmnContent += `
      <bpmndi:BPMNEdge bpmnElement="${id}" id="BPMNEdge_${id}">
        <di:waypoint x="${startPoint.x}" y="${startPoint.y}"/>
        <di:waypoint x="${endPoint.x}" y="${endPoint.y}"/>
      </bpmndi:BPMNEdge>`;
            });

            bpmnContent += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

            // 发送到服务器
            const formData = new FormData();
            formData.append('bpmnXml', bpmnContent);
            formData.append('processName', '动态流程');
            
            const response = await axios.post('http://localhost:8086/api/deployment/deploy-with-resources', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.status === 200) {
                alert('流程部署成功！');
            } else {
                alert('流程部署失败：' + response.statusText);
            }
        } catch (error) {
            console.error('部署流程时出错：', error);
            alert('流程部署失败：' + error.message);
        }
    };

    const handleStartProcess = async () => {
        try {
            // 发送启动流程请求
            const response = await axios.post(
                'http://localhost:8086/api/workflow/start?processDefinitionKey=leaveProcess&businessKey=leave_123',
                {
                    applicant: "张三",
                    manager: "李四",
                    leaveDays: 5
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.status === 200) {
                alert('流程启动成功！');
            } else {
                alert('流程启动失败：' + response.statusText);
            }
        } catch (error) {
            console.error('启动流程时出错：', error);
            alert('流程启动失败：' + error.message);
        }
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
                                borderRadius: p.type === "start-node" || p.type === "end-node" ? "50%" : p.type === "exclusive-gateway" ? "0" : "6px",
                                width: (p.type === "start-node" || p.type === "end-node") ? 44 : p.type === "exclusive-gateway" ? 36 : 36,
                                height: (p.type === "start-node" || p.type === "end-node") ? 44 : p.type === "exclusive-gateway" ? 36 : 28,
                                transform: p.type === "exclusive-gateway" ? "rotate(45deg)" : "none",
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
                    <button className="primary" onClick={handleImportBpmn}>导入请假流程</button>
                    <button onClick={handleSave}>保存</button>
                    <button onClick={handleLoad}>加载</button>
                    <button onClick={handleExportBpmn}>导出 .bpmn</button>
                    <button onClick={handleViewJson}>查看JSON</button>
                    <button onClick={handleUndo}>回退</button>
                    <button onClick={handleClear}>清空</button>
                    <button className="primary" onClick={handleDeployProcess}>部署流程</button>
                    <button className="primary" onClick={handleStartProcess}>启动流程</button>
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