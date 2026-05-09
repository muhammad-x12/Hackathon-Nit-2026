import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft, Loader2, Save, Type, Image as LucideImage, Trash2,
    Settings2, Palette
} from 'lucide-react';
import * as fabric from 'fabric';

const AddEditSchoolProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [product, setProduct] = useState(null);
    const [activeObject, setActiveObject] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [designStates, setDesignStates] = useState([]);

    const [setupData, setSetupData] = useState({ margin: 10, requiredQty: '' });
    const [textSettings, setTextSettings] = useState({
        fontSize: 30, fontFamily: 'arial', fill: '#000000', fontWeight: 'normal', isCurved: false, curveRadius: 150,
    });

    const fonts = [
        { name: 'ARIAL PRO', value: 'arial' },
        { name: 'INTER TIER', value: 'inter' },
        { name: 'ROBOTO NODE', value: 'roboto' },
        { name: 'IMPACT CORE', value: 'impact' },
    ];

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get('/school/master-catalog');
                const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
                const selected = list.find(p => p.id === parseInt(id));
                if (selected) {
                    setProduct(selected);
                    const count = selected.images?.length || 1;
                    setDesignStates(new Array(count).fill(null));
                    if (selected.school_products?.[0]) {
                        const s = selected.school_products[0];
                        setSetupData({ margin: s.school_margin ?? 10, requiredQty: s.required_qty || '' });
                    }
                }
            } catch (err) { console.error('Product Fetch Error', err); } finally { setLoading(false); }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (!loading && product && canvasRef.current && !fabricCanvas.current) {
            const canvas = new fabric.Canvas(canvasRef.current, {
                width: 500, height: 500, backgroundColor: '#ffffff', preserveObjectStacking: true,
            });
            fabricCanvas.current = canvas;
            canvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
            canvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
            canvas.on('selection:cleared', () => setActiveObject(null));
            loadBackgroundImage(0);
        }
    }, [loading, product]);

    const loadBackgroundImage = async (index) => {
        if (!fabricCanvas.current || !product?.images?.[index]) return;
        const canvas = fabricCanvas.current;
        return new Promise((resolve) => {
            fabric.FabricImage.fromURL(product.images[index], { crossOrigin: 'anonymous' }).then((img) => {
                const scale = Math.min(500 / img.width, 500 / img.height);
                canvas.getObjects().forEach(obj => { if (obj.isBackground) canvas.remove(obj) });
                img.set({ originX: 'center', originY: 'center', left: 250, top: 250, scaleX: scale, scaleY: scale, selectable: false, evented: false, isBackground: true });
                canvas.add(img);
                canvas.sendObjectToBack(img);
                canvas.renderAll();
                resolve();
            }).catch(err => {
                console.error("Background loading failed", err);
                resolve();
            });
        });
    };

    const switchView = async (newIndex) => {
        if (newIndex === currentImageIndex || !fabricCanvas.current) return;
        const json = fabricCanvas.current.toJSON(['isBackground']);
        setDesignStates(prev => { const n = [...prev]; n[currentImageIndex] = json; return n; });
        setCurrentImageIndex(newIndex);
        fabricCanvas.current.clear();
        fabricCanvas.current.backgroundColor = '#ffffff';
        const savedState = designStates[newIndex];
        if (savedState) {
            await fabricCanvas.current.loadFromJSON(savedState);
            const bg = fabricCanvas.current.getObjects().find(o => o.isBackground);
            if (bg) fabricCanvas.current.sendObjectToBack(bg);
            else await loadBackgroundImage(newIndex);
            fabricCanvas.current.renderAll();
        } else await loadBackgroundImage(newIndex);
    };

    const addText = () => {
        if (!fabricCanvas.current) return;
        const text = new fabric.IText('ADD TEXT', {
            left: 250, top: 250, originX: 'center', originY: 'center',
            fontSize: 40, fontFamily: 'arial', fill: '#000000',
            fontWeight: 'bold', textAlign: 'center',
            borderColor: '#6366f1',
            cornerColor: '#6366f1',
            cornerSize: 12,
            transparentCorners: false,
            padding: 10,
            rotatingPointOffset: 40
        });
        fabricCanvas.current.add(text);
        text.setCoords(); // Critical for proper transform box calculation
        fabricCanvas.current.setActiveObject(text);
        fabricCanvas.current.renderAll();
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => fabric.FabricImage.fromURL(f.target.result).then(img => {
            const scale = Math.min(150 / img.width, 150 / img.height);
            img.set({
                left: 250, top: 250, originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale,
                borderColor: '#6366f1',
                cornerColor: '#6366f1',
                cornerSize: 12,
                transparentCorners: false,
                padding: 10
            });
            fabricCanvas.current.add(img);
            img.setCoords(); // Updates boundary coordinates
            fabricCanvas.current.setActiveObject(img);
            fabricCanvas.current.renderAll();
        });
        reader.readAsDataURL(file);
    };

    const updateTextParams = (key, val) => {
        setTextSettings(s => ({ ...s, [key]: val }));
        if (activeObject?.type === 'i-text') {
            activeObject.set(key, val);
            if (key === 'isCurved' || key === 'curveRadius') {
                const curved = key === 'isCurved' ? val : textSettings.isCurved;
                const r = key === 'curveRadius' ? val : textSettings.curveRadius;
                activeObject.set('path', curved ? new fabric.Path(`M 0 0 A ${r} ${r} 0 0 1 ${r * 2} 0`, { visible: false }) : null);
            }
            fabricCanvas.current.renderAll();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const finalStates = [...designStates];
            finalStates[currentImageIndex] = fabricCanvas.current.toJSON(['isBackground']);
            const blobs = [];
            const imgCount = product.images?.length || 1;
            for (let i = 0; i < imgCount; i++) {
                fabricCanvas.current.clear();
                fabricCanvas.current.backgroundColor = '#ffffff';
                if (finalStates[i]) {
                    await fabricCanvas.current.loadFromJSON(finalStates[i]);
                    const bgExists = fabricCanvas.current.getObjects().find(o => o.isBackground);
                    if (!bgExists) await loadBackgroundImage(i);
                    else { bgExists.set({ selectable: false, evented: false }); fabricCanvas.current.sendObjectToBack(bgExists); }
                } else await loadBackgroundImage(i);
                fabricCanvas.current.discardActiveObject();
                fabricCanvas.current.renderAll();
                const dataUrl = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 2 });
                const blobResponse = await fetch(dataUrl);
                const blob = await blobResponse.blob();
                blobs.push(blob);
            }
            const fd = new FormData();
            fd.append('product_id', id);
            fd.append('school_margin', setupData.margin);
            if (setupData.requiredQty) fd.append('required_qty', setupData.requiredQty);
            blobs.forEach((b, idx) => fd.append('rendered_images[]', b, `view_${idx}.png`));
            await api.post('/school/select-product', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            navigate('/school/catalog');
        } catch (err) {
            console.error('Final Save Error:', err);
            alert(`Failed to save design sequence: ${err.response?.data?.message || err.message}`);
        } finally { setIsSubmitting(false); switchView(currentImageIndex); }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-10">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-white/5 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-t-indigo-500 rounded-full animate-spin absolute top-0"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                    <Loader2 size={24} className="animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.8em]">Loading Setup</p>
                <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-indigo-500 animate-pulse"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/school/catalog')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                            <ArrowLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Product Setup</h1>
                            <p className="text-xs text-slate-500">{product?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Configuration
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Design Area */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button onClick={addText} className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-bold text-slate-600">
                                        <Type size={14} className="text-indigo-500" /> Add Text
                                    </button>
                                    <label className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-bold text-slate-600 cursor-pointer">
                                        <LucideImage size={14} className="text-emerald-500" /> Upload Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                                <button
                                    onClick={() => { if (activeObject) fabricCanvas.current.remove(activeObject); setActiveObject(null); }}
                                    disabled={!activeObject}
                                    className={`p-2 rounded-lg transition-all ${activeObject ? 'text-red-500 hover:bg-red-50 border border-red-100' : 'text-slate-300'}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-2 shadow-inner">
                                    <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
                                </div>

                                <div className="mt-8 flex gap-3 overflow-x-auto pb-2 w-full justify-center">
                                    {product?.images?.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => switchView(idx)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${currentImageIndex === idx ? 'border-indigo-600 shadow-md ring-2 ring-indigo-50' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img} className="w-full h-full object-cover" alt="view" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls Area */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Object Controls */}
                        {activeObject && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                                    <Settings2 size={18} className="text-indigo-600" />
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Adjustment Tools</h3>
                                </div>

                                {activeObject.type === 'i-text' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Font Style</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {fonts.map(f => (
                                                    <button
                                                        key={f.value}
                                                        onClick={() => updateTextParams('fontFamily', f.value)}
                                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${textSettings.fontFamily === f.value ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                                        style={{ fontFamily: f.value }}
                                                    >
                                                        {f.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Curved Text</label>
                                                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                                                    <button onClick={() => updateTextParams('isCurved', false)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold ${!textSettings.isCurved ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>OFF</button>
                                                    <button onClick={() => updateTextParams('isCurved', true)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold ${textSettings.isCurved ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>ON</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Bold</label>
                                                <button
                                                    onClick={() => updateTextParams('fontWeight', textSettings.fontWeight === 'bold' ? 'normal' : 'bold')}
                                                    className={`w-full py-2.5 rounded-lg border text-[10px] font-bold transition-all ${textSettings.fontWeight === 'bold' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
                                                >
                                                    BOLD
                                                </button>
                                            </div>
                                        </div>

                                        {textSettings.isCurved && (
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase">
                                                    <span>Curve Radius</span>
                                                    <span>{textSettings.curveRadius}</span>
                                                </div>
                                                <input type="range" min="50" max="1000" step="10" value={textSettings.curveRadius} onChange={(e) => updateTextParams('curveRadius', parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Color</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['#000000', '#FFFFFF', '#6366F1', '#F43F5E', '#10B981', '#F59E0B'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateTextParams('fill', c)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${textSettings.fill === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-slate-100 hover:scale-110'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-slate-400">
                                        <LucideImage className="mx-auto mb-3 opacity-20" size={32} />
                                        <p className="text-xs font-medium uppercase tracking-wider">Asset Selected</p>
                                        <p className="text-[10px] mt-1">Scale and move on the canvas.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Store Parameters */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                                <Palette size={18} className="text-indigo-600" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Store Economics</h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">School Margin (%)</label>
                                        <span className="text-2xl font-black text-slate-900">{setupData.margin}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={setupData.margin} onChange={(e) => setSetupData({ ...setupData, margin: e.target.value })} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                                </div>

                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center gap-1 shadow-sm">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Selling Price</span>
                                    <span className="text-3xl font-black text-indigo-700">₹{Math.round(Number(product?.base_price || 0) + (Number(setupData.margin || 0) / 100 * Number(product?.base_price || 0))).toLocaleString()}</span>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Minimum Batch Quantity</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            value={setupData.requiredQty}
                                            onChange={(e) => setSetupData({ ...setupData, requiredQty: e.target.value })}
                                            placeholder="Ex: 50"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Units</div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Base Price: ₹{Number(product?.base_price || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEditSchoolProduct;

