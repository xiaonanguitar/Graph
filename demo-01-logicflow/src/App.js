import logo from './logo.svg';
import './App.css';
import FlowGraph from './components/FlowGraph';
// 在 App 的 JSX 中需要渲染的位置添加：<FlowGraph />

function App() {
  return (
    <div className="App">
      <FlowGraph></FlowGraph>
    </div>
  );
}

export default App;
