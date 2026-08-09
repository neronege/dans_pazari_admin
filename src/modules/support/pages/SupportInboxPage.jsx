'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import {
  getInboundEmailDetail,
  markInboundEmailRead,
  replyInboundEmail
} from 'modules/support/api/support.service';
import useSupportInbox from 'modules/support/hooks/useSupportInbox';
import { getHumanReadableError } from 'shared/api';

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('tr-TR');
  } catch {
    return String(value);
  }
}

export default function SupportInboxPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionInfo, setActionInfo] = useState('');
  const [sending, setSending] = useState(false);

  const { emails, isLoading, error, refresh } = useSupportInbox({ unreadOnly, take: 50 });

  const openDetail = async (id) => {
    try {
      setActionError('');
      setActionInfo('');
      setReplyBody('');
      const response = await getInboundEmailDetail(id);
      setDetail(response);
      setDetailOpen(true);
      if (!response?.isRead) {
        await markInboundEmailRead(id);
        await refresh();
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onReply = async () => {
    if (!detail?.id || !replyBody.trim()) {
      setActionError('Yanıt metni zorunludur.');
      return;
    }

    try {
      setSending(true);
      setActionError('');
      await replyInboundEmail(detail.id, replyBody.trim());
      setActionInfo('Yanıt gönderildi (support@museticket.com).');
      setReplyBody('');
      const updated = await getInboundEmailDetail(detail.id);
      setDetail(updated);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <MainCard title="Destek Gelen Kutusu (support@museticket.com)">
        <Stack sx={{ gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />}
            label="Yalnızca okunmamış"
          />

          {error && <Alert severity="error">Destek mailleri alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}
          {actionInfo && <Alert severity="success">{actionInfo}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kimden</TableCell>
                  <TableCell>Konu</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Önizleme</TableCell>
                  <TableCell align="right">İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Yükleniyor...</TableCell>
                  </TableRow>
                )}
                {!isLoading && emails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>Kayıt yok.</TableCell>
                  </TableRow>
                )}
                {emails.map((email) => (
                  <TableRow key={email.id} selected={!email.isRead} hover>
                    <TableCell>{email.isRead ? 'Okundu' : 'Yeni'}</TableCell>
                    <TableCell>{field(email.fromEmail)}</TableCell>
                    <TableCell>{field(email.subject)}</TableCell>
                    <TableCell>{formatDate(email.receivedAtUtc)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                        {field(email.preview)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => openDetail(email.id)}>
                        Aç
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </MainCard>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{field(detail?.subject, 'Destek maili')}</DialogTitle>
        <DialogContent dividers>
          <Stack sx={{ gap: 2 }}>
            <Typography variant="body2">
              <strong>Kimden:</strong> {field(detail?.fromEmail)}
            </Typography>
            <Typography variant="body2">
              <strong>Tarih:</strong> {formatDate(detail?.receivedAtUtc)}
            </Typography>
            {detail?.lastRepliedAtUtc ? (
              <Typography variant="body2">
                <strong>Son yanıt:</strong> {formatDate(detail.lastRepliedAtUtc)}
              </Typography>
            ) : null}
            <Typography variant="subtitle2">Gelen mesaj</Typography>
            <Typography
              component="pre"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}
            >
              {field(detail?.textBody || detail?.htmlBody, '(Boş gövde)')}
            </Typography>
            {detail?.lastReplyBody ? (
              <>
                <Typography variant="subtitle2">Önceki yanıtınız</Typography>
                <Typography
                  component="pre"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}
                >
                  {detail.lastReplyBody}
                </Typography>
              </>
            ) : null}
            <TextField
              label="Yanıt"
              multiline
              minRows={5}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              fullWidth
              placeholder="support@museticket.com adresinden gönderilir"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Kapat</Button>
          <Button variant="contained" onClick={onReply} disabled={sending || !replyBody.trim()}>
            {sending ? 'Gönderiliyor...' : 'Yanıtla'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
