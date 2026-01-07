 import React, { useEffect, useRef } from 'react'
import { Graph } from '@antv/x6'

// /e:/Code/logicflow/demo-02-antvx6/src/components/Graph.jsx

export default function GraphComponent() {
    const containerRef = useRef(null)
    const graphRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return

        const graph = new Graph({
            container: containerRef.current,
            grid: true,
            panning: { enabled: true }, 
            mousewheel: { enabled: false },
            background: { color: '#fafafa' },
            connecting: {
                anchor: 'center',
                connectionPoint: 'anchor',
                snap: true,
                allowBlank: false,
            },
            selecting: { enabled: true, rubberband: true },
        })
        graphRef.current = graph

        // three demo nodes
        const n1 = graph.addNode({
            id: 'node1',
            x: 40,
            y: 40,
            width: 140,
            height: 60,
            attrs: {
                body: {
                    stroke: '#5F95FF',
                    fill: '#EFF4FF',
                    rx: 6,
                    ry: 6,
                },
                label: {
                    text: 'Task A',
                    fill: '#1A1A1A',
                },
            },
        })

        const n2 = graph.addNode({
            id: 'node2',
            x: 240,
            y: 40,
            width: 140,
            height: 60,
            attrs: {
                body: {
                    stroke: '#19A879',
                    fill: '#ECF7F1',
                    rx: 6,
                    ry: 6,
                },
                label: {
                    text: 'Task B',
                    fill: '#1A1A1A',
                },
            },
        })

        const n3 = graph.addNode({
            id: 'node3',
            x: 440,
            y: 40,
            width: 140,
            height: 60,
            attrs: {
                body: {
                    stroke: '#FFB13B',
                    fill: '#FFF4E6',
                    rx: 6,
                    ry: 6,
                },
                label: {
                    text: 'Task C',
                    fill: '#1A1A1A',
                },
            },
        })

        // sample edges (users can also create edges via connecting)
        graph.addEdge({
            id: 'edge1',
            source: { cell: 'node1' },
            target: { cell: 'node2' },
            attrs: {
                line: {
                    stroke: '#A2B1FF',
                    strokeWidth: 2,
                },
            },
        })

        graph.addEdge({
            id: 'edge2',
            source: { cell: 'node2' },
            target: { cell: 'node3' },
            attrs: {
                line: {
                    stroke: '#BFF0D6',
                    strokeWidth: 2,
                },
            },
        })

        // cleanup on unmount
        return () => {
            graph.dispose()
            graphRef.current = null
        }
    }, [])

    // export graph to a simple BPMN XML (tasks + sequenceFlows + BPMNDI bounds)
    function exportToBpmn() {
        const graph = graphRef.current
        if (!graph) return

        const nodes = graph.getNodes().map((n) => {
            const id = n.id
            const label = n.attr('label/text') || id
            const bbox = n.getBBox()
            return {
                id,
                label,
                x: Math.round(bbox.x),
                y: Math.round(bbox.y),
                width: Math.round(bbox.width),
                height: Math.round(bbox.height),
            }
        })

        const edges = graph.getEdges().map((e) => {
            const id = e.id
            const src = e.getSource()
            const tgt = e.getTarget()
            return {
                id,
                source: src.cell,
                target: tgt.cell,
            }
        })

        const defs = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
            `xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ` +
            `xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ` +
            `xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ` +
            `id="Definitions_1" targetNamespace="http://example.com/bpmn">\n`

        const processOpen = `  <bpmn:process id="Process_1" isExecutable="false">\n`
        const processTasks = nodes.map((n) => {
            const taskId = `Task_${n.id}`
            return `    <bpmn:task id="${taskId}" name="${escapeXml(n.label)}" />\n`
        }).join('')

        const processFlows = edges.map((f) => {
            const flowId = `Flow_${f.id}`
            const sourceRef = `Task_${f.source}`
            const targetRef = `Task_${f.target}`
            return `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${sourceRef}" targetRef="${targetRef}" />\n`
        }).join('')

        const processClose = `  </bpmn:process>\n`

        // BPMN DI for visual positions
        const diOpen = `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\n`
        const diShapes = nodes.map((n) => {
            const shapeId = `BPMNShape_${n.id}`
            const taskId = `Task_${n.id}`
            return (
                `      <bpmndi:BPMNShape id="${shapeId}" bpmnElement="${taskId}">\n` +
                `        <dc:Bounds x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" />\n` +
                `      </bpmndi:BPMNShape>\n`
            )
        }).join('')

        const diEdges = edges.map((f) => {
            const edgeId = `BPMNEdge_${f.id}`
            const flowId = `Flow_${f.id}`
            // minimal edge without waypoints (tools can reconstruct)
            return `      <bpmndi:BPMNEdge id="${edgeId}" bpmnElement="${flowId}" />\n`
        }).join('')

        const diClose = `    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n`
        const xml = defs + processOpen + processTasks + processFlows + processClose + diOpen + diShapes + diEdges + diClose + `</bpmn:definitions>`

        // download
        const blob = new Blob([xml], { type: 'application/xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'diagram.bpmn'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    function escapeXml(str = '') {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: 8 }}>
                <button onClick={exportToBpmn}>保存为 BPMN 并下载</button>
            </div>
            <div ref={containerRef} style={{ flex: 1, border: '1px solid #ddd', margin: 8, minHeight: 300 }} />
        </div>
    )
}