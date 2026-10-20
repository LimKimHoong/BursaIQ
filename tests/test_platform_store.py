from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bursaiq.platform_store import PlatformStore


class PlatformStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / "platform.sqlite3"
        self.store = PlatformStore(self.database)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_items_and_settings_persist_across_restarts(self) -> None:
        room = self.store.create("room", {"title": "Market room", "owner": "Demo User", "status": "DRAFT", "data": {"description": "Shared analysis"}})
        decision = self.store.create("decision", {"title": "Proceed", "status": "RECORDED", "data": {"question": "Should we proceed?", "evidence": [{"id": "source-1"}]}})
        self.store.save_settings("lim-kim-hoong", {"reducedUpdates": True, "defaultWorkspace": "Product Development"})

        reopened = PlatformStore(self.database)
        self.assertEqual(reopened.get("room", room["id"])["data"]["description"], "Shared analysis")
        self.assertEqual(reopened.get("decision", decision["id"])["data"]["evidence"][0]["id"], "source-1")
        self.assertTrue(reopened.settings("lim-kim-hoong")["reducedUpdates"])

    def test_update_and_delete_are_type_scoped(self) -> None:
        item = self.store.create("connector", {"title": "Microsoft 365", "status": "REQUESTED", "data": {"description": "Email delivery"}})
        updated = self.store.update("connector", item["id"], {"status": "APPROVED"})
        self.assertEqual(updated["status"], "APPROVED")
        with self.assertRaises(KeyError):
            self.store.get("project", item["id"])
        self.store.delete("connector", item["id"])
        self.assertEqual(self.store.list("connector"), [])

    def test_platform_api_crud_and_settings(self) -> None:
        from server import app

        with patch("server.platform", self.store):
            with app.test_client() as client:
                created = client.post("/api/platform/project", json={"title": "New project", "owner": "Demo User", "status": "DRAFT", "data": {"description": "Persistent context"}})
                self.assertEqual(created.status_code, 201)
                project = created.get_json()
                changed = client.patch(f"/api/platform/project/{project['id']}", json={"status": "ACTIVE"})
                self.assertEqual(changed.get_json()["status"], "ACTIVE")
                state = client.get("/api/platform").get_json()
                self.assertEqual(state["items"]["project"][0]["title"], "New project")
                settings = client.patch("/api/settings", json={"reducedUpdates": True}).get_json()
                self.assertTrue(settings["reducedUpdates"])
                self.assertEqual(client.delete(f"/api/platform/project/{project['id']}").status_code, 204)


if __name__ == "__main__":
    unittest.main()
