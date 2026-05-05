"use client";
import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Wrench, Sparkles, Plus, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function TasksModule() {
    const allProperties = ["Oceanfront Luxury Villa", "Downtown Penthouse", "Mountain Retreat", "Cozy Beach Cottage", "Urban Loft"];
    
    // Core state management mapped strictly 
    const [tasks, setTasks] = useState([
        { id: "T-001", type: "Cleaning", property: "Oceanfront Luxury Villa", status: "In Progress", time: "Due 3:00 PM", desc: "Standard turnover cleaning before guest arrival." },
        { id: "T-002", type: "Maintenance", property: "Downtown Penthouse", status: "Pending", time: "Due Tomorrow", desc: "Fix leaking faucet in master bathroom." },
        { id: "T-003", type: "Cleaning", property: "Cozy Beach Cottage", status: "Completed", time: "Finished 11:30 AM", desc: "Deep cleaning post check-out." },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ type: "Cleaning", property: allProperties[0], time: "Due Today", desc: "" });

    // Ensure hydration logic prevents SSR mismatch bounding errors commonly associated with DND
    const [isBrowser, setIsBrowser] = useState(false);
    useEffect(() => setIsBrowser(true), []);

    const handleCreateTask = (e) => {
        e.preventDefault();
        if (!newTask.desc) return;
        
        const created = {
            id: `T-00${tasks.length + 1}`,
            status: "Pending",
            ...newTask
        };
        setTasks([...tasks, created]);
        setShowModal(false);
        setNewTask({ type: "Cleaning", property: allProperties[0], time: "Due Today", desc: "" });
    };

    const updateStatus = (id, newStatus) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    // DND Drag Action Dispatcher
    const onDragEnd = (result) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;

        if (source.droppableId !== destination.droppableId) {
            updateStatus(draggableId, destination.droppableId);
        }
    };

    const StatusColumn = ({ title, statusFilter, colorTheme }) => {
        const columnTasks = tasks.filter(t => t.status === statusFilter);

        return (
            <div className={`glass-panel p-6 flex flex-col overflow-hidden ${colorTheme}`}>
                <h3 className="font-bold text-[#0c1929] uppercase tracking-widest text-xs mb-4 flex justify-between relative z-10">
                    {title} 
                    <span className="glass-chip text-[#0c1929] px-2 py-0.5 rounded-full bg-white/60 border-white/80 shadow-sm">{columnTasks.length}</span>
                </h3>
                
                <Droppable droppableId={statusFilter}>
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps} 
                            className={`space-y-4 overflow-y-auto pr-2 pb-2 relative z-10 flex-1 min-h-[150px] transition-colors duration-300 ${snapshot.isDraggingOver ? 'bg-blue-50/40 rounded-2xl ring-1 ring-blue-200 shadow-inner' : ''}`}
                        >
                            {columnTasks.map((t, index) => (
                                <Draggable key={t.id} draggableId={t.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            {...provided.dragHandleProps} 
                                            className={`glass-panel-strong p-4 rounded-2xl border transition-all ${
                                                snapshot.isDragging 
                                                ? 'shadow-2xl border-blue-400 rotate-3 scale-105 z-50 bg-white shadow-blue-500/20' 
                                                : 'border-white/50 cursor-grab hover:shadow-xl bg-white/60 hover:-translate-y-1'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                {t.type === 'Cleaning' ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm"><Sparkles className="w-3 h-3" /> {t.type}</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm"><Wrench className="w-3 h-3" /> {t.type}</span>
                                                )}
                                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${t.status === 'Completed' ? 'text-emerald-600/70' : 'text-[#0c1929]'}`}>
                                                    {t.status !== 'Completed' && <Clock className="w-3 h-3" />} {t.time}
                                                </span>
                                            </div>
                                            <h4 className={`font-bold mb-1 ${t.status === 'Completed' ? 'text-[#0c1929] line-through decoration-[#0c1929]' : 'text-[#0c1929]'}`}>{t.property}</h4>
                                            <p className="text-xs text-[#0c1929] mb-4">{t.desc}</p>
                                            
                                            <div className="flex justify-between items-center bg-white/40 p-2 rounded-xl border border-white/60">
                                                <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-white">JD</div>
                                                
                                                {t.status === 'Pending' && (
                                                    <button onClick={() => updateStatus(t.id, 'In Progress')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm hover:bg-blue-100 relative z-20">Start Task</button>
                                                )}
                                                {t.status === 'In Progress' && (
                                                    <button onClick={() => updateStatus(t.id, 'Completed')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-200/50 hover:bg-emerald-100 relative z-20"><CheckCircle2 className="w-4 h-4" /> Mark Done</button>
                                                )}
                                                {t.status === 'Completed' && (
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                <div className="p-8 mt-4 rounded-xl border border-dashed border-white/50 text-center text-[#0c1929] text-xs font-bold uppercase tracking-wider bg-white/20 pointer-events-none">Empty Grid</div>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
        );
    };

    if (!isBrowser) return null;

    return (
        <div className="h-full flex flex-col relative w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight">Tasks & Operations</h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="glass-button rounded-xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 hover:shadow-md hover:bg-white/80 active:bg-white/50 border border-white/60"
                >
                    <Plus className="w-4 h-4" /> Create New Task
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto">
                    <StatusColumn title="To Do" statusFilter="Pending" colorTheme="bg-slate-50/10" />
                    <StatusColumn title="In Progress" statusFilter="In Progress" colorTheme="bg-blue-50/30" />
                    <StatusColumn title="Completed" statusFilter="Completed" colorTheme="opacity-80 hover:opacity-100 transition-opacity bg-slate-100/10" />
                </div>
            </DragDropContext>

            {/* Modal Overlay leveraging Z-index physics */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                    <div className="absolute inset-0 bg-[#0c1929]/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                    <div className="glass-panel-strong w-full h-full max-w-[1600px] p-8 md:p-12 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 bg-white/95 overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-md"><Sparkles className="w-6 h-6" /></div>
                                <div>
                                  <h2 className="text-3xl font-bold text-[#0c1929] tracking-tight">Assign New Task</h2>
                                  <p className="text-[#0c1929] font-semibold mt-1">Determine operational properties and execution windows.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-[#0c1929] hover:text-[#0c1929] transition bg-slate-100 hover:bg-slate-200 rounded-full p-3 shadow-inner"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="flex-1 max-w-2xl mx-auto w-full pt-4">
                        
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#0c1929] uppercase tracking-wider mb-2">Property Identity</label>
                                <select 
                                    value={newTask.property}
                                    onChange={(e) => setNewTask({...newTask, property: e.target.value})}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none outline-none cursor-pointer font-medium"
                                >
                                    {allProperties.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#0c1929] uppercase tracking-wider mb-2">Task Type</label>
                                    <select 
                                        value={newTask.type}
                                        onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                                        className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none outline-none cursor-pointer font-medium"
                                    >
                                        <option value="Cleaning">Cleaning</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Inspection">Inspection</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#0c1929] uppercase tracking-wider mb-2">Due Frame</label>
                                    <input 
                                        type="text" 
                                        value={newTask.time}
                                        onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                                        placeholder="e.g. Due 4:00 PM"
                                        className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929]"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[#0c1929] uppercase tracking-wider mb-2">Operational Instructions</label>
                                <textarea 
                                    required
                                    value={newTask.desc}
                                    onChange={(e) => setNewTask({...newTask, desc: e.target.value})}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none resize-none h-28 font-medium text-[#0c1929]"
                                    placeholder="Enter requirements or gate-codes..."
                                ></textarea>
                            </div>
                            
                            <button type="submit" className="glass-button w-full rounded-xl px-5 py-4 text-base font-bold shadow-md transition-all mt-8 hover:bg-white/80 hover:shadow-lg active:bg-white/40 text-[#0c1929] border border-white/80">
                                Establish Task
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
