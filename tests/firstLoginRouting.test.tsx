import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AdminGuard from '../components/AdminGuard';
import CreatorPortal from '../pages/CreatorPortal/index';
import AdminLogin from '../components/AdminLogin';

type Role = 'ADMIN' | 'FACTORY';

function mockStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    clear: () => { data.clear(); },
  };
}

function LocationMarker() {
  const location = useLocation();
  return <span data-path={location.pathname}>{location.pathname}</span>;
}

async function testLogin(initialPath: string, loginRole: Role) {
  const priorFetch = globalThis.fetch;
  const priorStorage = (globalThis as any).sessionStorage;
  const storage = mockStorage();
  (globalThis as any).sessionStorage = storage;
  globalThis.fetch = async () => new Response(JSON.stringify({
    token: 'only-a-mocked-test-token',
    user: { id: 'user-1', username: 'test', role: loginRole, org_id: 'org-main' },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    await act(async () => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={[initialPath]}>
          <LocationMarker />
          <Routes>
            <Route path="/creator" element={<AdminGuard><CreatorPortal /></AdminGuard>} />
            <Route path="/creator/factory" element={
              <AdminGuard requiredRole="FACTORY"><p data-workspace="factory">Factory ready</p></AdminGuard>
            } />
            <Route path="/creator/admin" element={
              <AdminGuard requiredRole="ADMIN"><p data-workspace="admin">Admin ready</p></AdminGuard>
            } />
          </Routes>
        </MemoryRouter>
      );
    });

    assert.equal(renderer.root.findAllByType(AdminLogin).length, 1, 'should show a login form first');
    const inputs = renderer.root.findAllByType('input');
    await act(async () => {
      inputs[0].props.onChange({ target: { value: 'test' } });
      inputs[1].props.onChange({ target: { value: 'test-password' } });
    });
    await act(async () => {
      await renderer.root.findByType('form').props.onSubmit({ preventDefault() {} });
    });

    const target = loginRole === 'ADMIN' ? 'admin' : 'factory';
    assert.equal(renderer.root.findAllByProps({ 'data-workspace': target }).length, 1,
      'workspace should show immediately after login, without refreshing');
    assert.equal(renderer.root.findAllByType(AdminLogin).length, 0);
    assert.equal(renderer.root.findByType(LocationMarker).props['data-path'], '/creator/' + target);
    assert.equal(storage.getItem('pz_user_role'), loginRole);
    assert.equal(storage.getItem('pz_auth_token'), 'only-a-mocked-test-token');

    await act(async () => renderer.unmount());
  } finally {
    globalThis.fetch = priorFetch;
    (globalThis as any).sessionStorage = priorStorage;
  }
}

test('factory login from /creator enters workspace on the first attempt', async () => {
  await testLogin('/creator', 'FACTORY');
});

test('factory login from /creator/factory works even when the URL does not change', async () => {
  await testLogin('/creator/factory', 'FACTORY');
});

test('admin login from /creator enters admin workspace on the first attempt', async () => {
  await testLogin('/creator', 'ADMIN');
});

test('admin login from /creator/factory redirects to the correct role', async () => {
  await testLogin('/creator/factory', 'ADMIN');
});
