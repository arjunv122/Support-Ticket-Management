import React from 'react';
import './KanbanBoard.css';

const KanbanBoard = ({ tickets, onStatusChange, onReassign, agents, setError, user, onTogglePin }) => {
    // Standard pipeline
    const columns = [
        { id: 'OPEN', label: 'Open' },
        { id: 'IN_PROGRESS', label: 'In Progress' },
        { id: 'RESOLVED', label: 'Resolved' }
    ];

    const handleDragStart = (e, ticketId) => {
        e.dataTransfer.setData('ticketId', ticketId);
        // Optional: add a class for drag styling
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
    };

    const handleDropOnColumn = (e, statusId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const ticketId = e.dataTransfer.getData('ticketId');
        if (!ticketId) return;

        // Check if ticket is already in this status to avoid redundant API calls
        const ticket = tickets.find(t => t._id === ticketId);
        if (ticket && ticket.status !== statusId) {
            onStatusChange(ticketId, statusId);
        }
    };

    const handleDropOnAgent = (e, agentId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over-agent');
        const ticketId = e.dataTransfer.getData('ticketId');
        if (!ticketId) return;

        const ticket = tickets.find(t => t._id === ticketId);
        
        // CRITICAL BUSINESS RULE ENFORCEMENT
        if (ticket && ticket.reassignmentCount >= 1) {
            setError('⚠ CRITICAL RULE: A support ticket can be reassigned only once. This ticket is locked to its current agent.');
            return;
        }

        // Avoid self-reassignment spam
        if (ticket && ticket.assignedAgentId === agentId) return;

        onReassign(ticketId, agentId);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // allow dropping
    };

    const handleDragEnter = (e, type) => {
        if(type === 'col') e.currentTarget.classList.add('drag-over');
        if(type === 'agent') e.currentTarget.classList.add('drag-over-agent');
    };

    const handleDragLeave = (e, type) => {
        if(type === 'col') e.currentTarget.classList.remove('drag-over');
        if(type === 'agent') e.currentTarget.classList.remove('drag-over-agent');
    };

    return (
        <div className="kanban-wrapper">
            {/* Agent Assign Dropzones (Top Bar) */}
            <div className="kanban-agents-rail glass">
                <span className="rail-title">Drop ticket on agent to reassign:</span>
                <div className="agents-scroll-list">
                    {agents.map(agent => (
                        <div key={agent._id}
                             className="agent-drop-node"
                             onDrop={(e) => handleDropOnAgent(e, agent._id)}
                             onDragOver={handleDragOver}
                             onDragEnter={(e) => handleDragEnter(e, 'agent')}
                             onDragLeave={(e) => handleDragLeave(e, 'agent')}>
                            <div className="agent-avatar-circle">{agent.name.charAt(0).toUpperCase()}</div>
                            <span className="agent-drop-name">{agent.name.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="kanban-columns-container">
                {columns.map(col => (
                    <div key={col.id} 
                         className="kanban-col glass"
                         onDrop={(e) => handleDropOnColumn(e, col.id)}
                         onDragOver={handleDragOver}
                         onDragEnter={(e) => handleDragEnter(e, 'col')}
                         onDragLeave={(e) => handleDragLeave(e, 'col')}>
                        
                        <div className={`kanban-col-header status-${col.id.toLowerCase()}`}>
                            <h3>{col.label}</h3>
                            {col.id !== 'RESOLVED' && (
                                <span className="col-count">{tickets.filter(t => t.status === col.id).length}</span>
                            )}
                        </div>

                        <div className="kanban-col-body">
                            {tickets.filter(t => t.status === col.id).map(ticket => (
                                <div key={ticket._id} 
                                     className="kanban-card"
                                     draggable
                                     onDragStart={(e) => handleDragStart(e, ticket._id)}
                                     onDragEnd={handleDragEnd}>
                                    
                                    <div className="kcard-header">
                                        <div style={{ display:'flex', alignItems:'center' }}>
                                            <button 
                                                onClick={(e) => onTogglePin && onTogglePin(ticket._id, e)}
                                                style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'1.0rem', marginRight:'4px', color: ticket.pinnedBy?.includes(user?._id) ? '#fbbf24' : 'var(--text-muted)' }}>
                                                {ticket.pinnedBy?.includes(user?._id) ? '★' : '☆'}
                                            </button>
                                            <span className="kcard-id">{ticket.ticketId || 'TKT'}</span>
                                        </div>
                                        <span className={`badge-priority priority-${(ticket.priority||'medium').toLowerCase()}`}>
                                            {ticket.priority || 'MEDIUM'}
                                        </span>
                                    </div>
                                    
                                    <h4 className="kcard-title">{ticket.title}</h4>

                                    {ticket.tags && ticket.tags.length > 0 && (
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', margin:'6px 0' }}>
                                            {ticket.tags.map(t => <span key={t} style={{ fontSize:'0.65rem', padding:'1px 5px', background:'rgba(99,102,241,0.1)', color:'var(--primary-light)', borderRadius:'4px' }}>#{t}</span>)}
                                        </div>
                                    )}
                                    
                                    <div className="kcard-footer">
                                        <div className="kcard-customer">👤 {ticket.customerId?.name?.split(' ')[0]}</div>
                                        {ticket.reassignmentCount >= 1 ? (
                                            <div className="kcard-lock" title="Locked: Reassignment limit reached">🔒 limit</div>
                                        ) : (
                                            <div className="kcard-moves">{ticket.reassignmentCount}/1 reassigned</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
