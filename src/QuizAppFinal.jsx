import React, { useState, useMemo, useEffect } from 'react';
import questions from './questions404_full.json';

export default function QuizAppFinal() {
  const [mode, setMode] = useState('practice');
  const [page, setPage] = useState(0);
  const perPage = 20;
  const [answers, setAnswers] = useState({});
  const [examSet, setExamSet] = useState([]);
  const [examN, setExamN] = useState(100);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const totalQuestions = questions.length;

  const progress = useMemo(()=>{
    const answeredIds = Object.keys(answers).map(x=>parseInt(x)).filter(x=>!isNaN(x));
    const correct = answeredIds.filter(id => {
      const q = questions.find(x=>x.id===id);
      return q && answers[id] && q.answer && answers[id].toUpperCase()===q.answer.toUpperCase();
    }).length;
    const wrong = answeredIds.length - correct;
    return { answered: answeredIds.length, correct, wrong };
  },[answers]);

  useEffect(()=>{
    let t;
    if (timerRunning && timeLeftSec>0) {
      t = setInterval(()=>{
        setTimeLeftSec(s=>{
          if (s<=1) { clearInterval(t); setTimerRunning(false); setShowResults(true); return 0; }
          return s-1;
        });
      },1000);
    }
    return ()=>clearInterval(t);
  },[timerRunning,timeLeftSec]);

  function handleSelect(qid, opt) { setAnswers(prev=>({...prev, [qid]: opt})); }

  function startExam() {
    let N = parseInt(examN); if (!N || N<=0) N=100; if (N>totalQuestions) N=totalQuestions;
    const ids = questions.map(q=>q.id);
    for (let i = ids.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const pick = ids.slice(0,N); setExamSet(pick); setAnswers({}); setExamStarted(true); setShowResults(false);
    const secondsPerQuestion = (60*60)/100; const totalSec = Math.ceil(secondsPerQuestion * N);
    setTimeLeftSec(totalSec); setTimerRunning(true); setPage(0);
  }

  function submitExam(){ setTimerRunning(false); setShowResults(true); }

  function gradeForSet(setIds){
    const total = setIds.length; let correct=0; const details=[];
    for (const id of setIds){
      const q = questions.find(x=>x.id===id); const ua = answers[id]; const isCorrect = q && q.answer && ua && ua.toUpperCase()===q.answer.toUpperCase();
      if (isCorrect) correct++; else details.push({id, question: q?.question||'', your: ua||null, correct: q?.answer||null});
    }
    return { total, correct, wrong: total-correct, percent: total?Math.round(100*correct/total):0, details };
  }

  function currentList(){
    if (mode==='practice') return questions.slice(page*perPage, (page+1)*perPage);
    const chunkSize=1; const start = page*chunkSize; const ids = examSet.slice(start, start+chunkSize);
    return ids.map(id=>questions.find(q=>q.id===id)).filter(Boolean);
  }

  const progressPercent = Math.round((progress.answered/totalQuestions)*100);

  return (
    <div style={{fontFamily:'system-ui', padding:20}}>
      <h1>QuizApp 404 - Tài Chính Học</h1>
      <div style={{display:'flex', gap:10}}>
        <button onClick={()=>setMode('practice')}>Luyện tập</button>
        <button onClick={()=>setMode('exam')}>Kiểm tra</button>
      </div>
      <div style={{marginTop:10}}>Tiến độ: {progress.answered}/{totalQuestions} — Đúng: {progress.correct} — Sai: {progress.wrong}</div>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginTop:20}}>
        <div>
          {currentList().map(q=>(
            <div key={q.id} style={{border:'1px solid #ddd', padding:12, borderRadius:8, marginBottom:10}}>
              <div style={{fontWeight:600}}>{q.id}. {q.question}</div>
              <div style={{marginTop:8}}>
                {['A','B','C'].map(L=>(
                  <div key={L} style={{marginTop:6}}>
                    <button onClick={()=>handleSelect(q.id,L)} style={{padding:8, borderRadius:6}}>{L}. {q.options[L]||''}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{marginBottom:10}}>
            <label>Số câu (mặc định 100)</label>
            <input type="number" value={examN} onChange={e=>setExamN(e.target.value)} style={{width:'100%'}} />
          </div>
          {!examStarted ? <button onClick={startExam}>Bắt đầu kiểm tra</button> : (
            <div>
              <div>Time left: {Math.floor(timeLeftSec/60)}:{String(timeLeftSec%60).padStart(2,'0')}</div>
              <button onClick={submitExam}>Nộp bài</button>
            </div>
          )}
          <div style={{marginTop:10}}><button onClick={()=>{ setAnswers({}); setShowResults(false); setExamStarted(false); setTimerRunning(false); setExamSet([]); }}>Reset</button></div>
          {showResults && (
            <div style={{marginTop:12}}>
              <h3>Kết quả</h3>
              {mode==='exam' ? (()=>{ const res = gradeForSet(examSet); return (<div>{res.correct}/{res.total} đúng — {res.percent}%<details><summary>Danh sách sai ({res.details.length})</summary><ul>{res.details.map(d=>(<li key={d.id}><strong>{d.id}</strong>: {d.question}<br/>Bạn: {d.your||'—'} — Đúng: {d.correct}</li>))}</ul></details></div>) })() : (()=>{ const answeredIds = Object.keys(answers).map(x=>parseInt(x)).filter(x=>!isNaN(x)); const res = gradeForSet(answeredIds); return (<div>Bạn trả lời {answeredIds.length} — {res.correct} đúng ({res.percent}%)</div>) })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
