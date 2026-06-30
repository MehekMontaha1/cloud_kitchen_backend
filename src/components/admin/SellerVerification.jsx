import { useState } from 'react';
import { Card, Button, Badge, Modal } from '../common';

const statusConfig = {
  pending: { variant: 'warning', label: 'Pending Review' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

const docIcons = {
  'Business License': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'Food Handler Permit': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'Health Certificate': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

const SellerVerification = ({ sellers, onStatusChange }) => {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
    setShowModal(true);
  };

  const handleAction = (id, status) => {
    onStatusChange(id, status);
    setShowModal(false);
  };

  const pendingCount = sellers.filter(s => s.status === 'pending').length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Partner Verification</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review documents and licenses for sellers and delivery partners. {pendingCount > 0 && (
              <span className="text-amber-600">{pendingCount} pending review{pendingCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <Badge variant={pendingCount > 0 ? 'warning' : 'success'} size="lg" dot>
          {pendingCount > 0 ? `${pendingCount} Pending` : 'All Clear'}
        </Badge>
      </div>

      <div className="mt-6 space-y-4">
        {sellers.map((seller) => {
          const status = statusConfig[seller.status];
          const docIcon = docIcons[seller.docType] || docIcons['Business License'];

          return (
            <div
              key={seller.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    {docIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{seller.id}</span>
                      <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    </div>
                    <h3 className="mt-1 font-semibold text-slate-900">{seller.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{seller.email}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {seller.docType}
                      </span>
                      {seller.docUrl ? (
                        <a href={seller.docUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">{seller.doc}</a>
                      ) : (
                        <span>{seller.doc}</span>
                      )}
                      <span>Submitted: {seller.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleViewDetails(seller)}
                  >
                    View
                  </Button>
                  {seller.status === 'pending' && (
                    <>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleAction(seller.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleAction(seller.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Partner Details"
        size="lg"
      >
        {selectedSeller && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">{selectedSeller.name}</h4>
              <p className="text-sm text-slate-500">{selectedSeller.email}</p>
              <p className="mt-1 text-xs text-slate-400">ID: {selectedSeller.id}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-medium text-slate-700">Document Information</h4>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Document Type</p>
                  <p className="font-medium">{selectedSeller.docType}</p>
                </div>
                <div>
                  <p className="text-slate-400">File Name</p>
                  <p className="font-medium">{selectedSeller.doc}</p>
                </div>
                <div>
                  <p className="text-slate-400">Submitted</p>
                  <p className="font-medium">{selectedSeller.submittedAt}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <Badge variant={statusConfig[selectedSeller.status].variant} size="sm">
                    {statusConfig[selectedSeller.status].label}
                  </Badge>
                </div>
              </div>

              {selectedSeller.docUrl && (
                <div className="mt-4 flex gap-2">
                  <a
                    href={selectedSeller.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Document
                  </a>
                  <a
                    href={selectedSeller.docUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              {selectedSeller.status === 'pending' && (
                <>
                  <Button 
                    variant="danger"
                    onClick={() => handleAction(selectedSeller.id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="success"
                    onClick={() => handleAction(selectedSeller.id, 'approved')}
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SellerVerification;
